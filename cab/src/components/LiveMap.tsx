import React, { useEffect, useRef } from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import WebView, { WebViewMessageEvent } from 'react-native-webview';
import { Coordinates } from '../services/location';

export interface MapPoint extends Coordinates {
  label: string;
}

interface LiveMapProps {
  pickup?: MapPoint | null;
  destination?: MapPoint | null;
  driver?: MapPoint | null;
  current?: Coordinates | null;
  onMapPress?: (coordinates: Coordinates) => void;
  style?: StyleProp<ViewStyle>;
}

const MAP_HTML = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{height:100%;width:100%;margin:0;background:#e8eef0} .leaflet-control-attribution{font-size:9px} #map-error{display:none;position:absolute;inset:0;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;color:#334155;font:14px sans-serif;text-align:center;background:#e8eef0}</style>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head><body><div id="map"></div><div id="map-error"></div><script>
window.onerror=function(){const error=document.getElementById('map-error');error.textContent='Map could not be loaded. Check your internet connection and try again.';error.style.display='flex';};
const map=L.map('map',{zoomControl:true,attributionControl:true}).setView([20.5937,78.9629],5);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);
let markers=[];let routeLine=null;let lastFitKey='';let routeKey='';
function updateMap(points){
 markers.forEach(marker=>map.removeLayer(marker));markers=[];
 const locations=[];
 [['pickup',points.pickup],['destination',points.destination],['driver',points.driver],['current',points.current]].forEach(([kind,point])=>{
  if(!point)return;
  const marker=L.marker([point.latitude,point.longitude]).addTo(map).bindPopup(String(point.label||kind));
  markers.push(marker);locations.push([point.latitude,point.longitude]);
 });
 const nextRouteKey=points.pickup&&points.destination?[points.pickup.longitude,points.pickup.latitude,points.destination.longitude,points.destination.latitude].join(','):'';
 if(nextRouteKey!==routeKey){
  routeKey=nextRouteKey;
  if(routeLine){map.removeLayer(routeLine);routeLine=null;}
  if(nextRouteKey){
   const [pickupLon,pickupLat,destinationLon,destinationLat]=nextRouteKey.split(',');
   fetch('https://router.project-osrm.org/route/v1/driving/'+pickupLon+','+pickupLat+';'+destinationLon+','+destinationLat+'?overview=full&geometries=geojson')
    .then(response=>response.json()).then(result=>{
     if(routeKey!==nextRouteKey)return;
     const geometry=result.routes&&result.routes[0]&&result.routes[0].geometry.coordinates;
     if(geometry)routeLine=L.polyline(geometry.map(([lon,lat])=>[lat,lon]),{color:'#176b5b',weight:5,opacity:.8}).addTo(map);
    }).catch(error=>console.warn('Could not load route geometry:', error));
  }
 }
 const fitKey=nextRouteKey||locations.map(point=>point.join(',')).join('|');
 if(fitKey&&fitKey!==lastFitKey){map.fitBounds(locations,{padding:[35,35],maxZoom:15});lastFitKey=fitKey;}
}
map.on('click',event=>window.ReactNativeWebView.postMessage(JSON.stringify({latitude:event.latlng.lat,longitude:event.latlng.lng})));
window.updateMap=updateMap;
</script></body></html>`;

const LiveMap = ({
  pickup,
  destination,
  driver,
  current,
  onMapPress,
  style,
}: LiveMapProps) => {
  const webView = useRef<WebView>(null);
  const points = { pickup, destination, driver, current };
  const encodedPoints = JSON.stringify(points);
  const mapUpdateScript = `window.updateMap && window.updateMap(JSON.parse(decodeURIComponent('${encodeURIComponent(
    encodedPoints,
  )}'))); true;`;

  useEffect(() => {
    webView.current?.injectJavaScript(mapUpdateScript);
  }, [mapUpdateScript]);

  const handleMessage = (event: WebViewMessageEvent) => {
    if (!onMapPress) return;
    try {
      const coordinates = JSON.parse(event.nativeEvent.data) as Coordinates;
      if (
        Number.isFinite(coordinates.latitude) &&
        Number.isFinite(coordinates.longitude)
      ) {
        onMapPress(coordinates);
      }
    } catch {
      // Ignore non-coordinate messages from the map page.
    }
  };

  return (
    <View style={[styles.container, style]}>
      <WebView<{}>
        ref={webView}
        source={{ html: MAP_HTML, baseUrl: 'https://local.cab.app' }}
        originWhitelist={['*']}
        javaScriptEnabled
        domStorageEnabled
        onMessage={handleMessage}
        onLoadEnd={() => webView.current?.injectJavaScript(mapUpdateScript)}
        setSupportMultipleWindows={false}
        style={styles.webView}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 260,
    overflow: 'hidden',
    borderRadius: 12,
    backgroundColor: '#e8eef0',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});

export default LiveMap;
