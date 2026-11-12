# User aur Driver kya kar sakte hain

Yeh document CAB app ke maujooda frontend aur backend flows ko summarize karta hai. App local development ke liye hai.

## User

- Location permission and an active device location are required before using the app.
- Mobile number par OTP lekar account bana sakta hai aur sign in kar sakta hai.
- Current GPS location ko pickup bana sakta hai, aur OpenStreetMap place search ya map par tap karke destination select kar sakta hai.
- Mini, Sedan, SUV ya Auto select kar sakta hai.
- Har ride ka payment cash in hand hota hai.
- OpenStreetMap par pickup, destination, route aur assigned driver ki latest reported location dekh sakta hai.
- Apni booking ka status dekh sakta hai: driver dhoonda ja raha hai, driver ne accept kiya, ride chal rahi hai, ya ride complete/cancel hui.
- Requested ya accepted booking cancel kar sakta hai.
- Purani rides aur backend mein record hue cash fare transactions dekh sakta hai.
- Apni profile dekh sakta hai aur sign out kar sakta hai.

## Driver

- Location permission aur active device location zaroori hai.
- App se naam, phone, vehicle aur driving-licence details dekar register kar sakta hai; phone OTP verify hota hai.
- Registration ke baad driver default se offline hota hai; dashboard se online ja sakta hai.
- Online ya offline status set kar sakta hai.
- Online hone par apne liye assign hui ride request dekh sakta hai, jisme rider, route, cab aur estimated fare ki jaankari hoti hai.
- Ride request accept ya decline kar sakta hai.
- Accept karne ke baad pickup par pahunchne ki confirmation dekar ride start kar sakta hai.
- Ride complete karke fare record kar sakta hai.
- Online ya active ride ke dauran apni live GPS location backend ko bhejta hai, jisse rider map par driver marker update hota hai.
- Apni completed rides aur recorded cash fares dekh sakta hai.
- Apni driver profile dekh sakta hai aur sign out kar sakta hai.

## Local app ki seemaayein

- Map par OpenStreetMap tiles, place search ke liye Nominatim, aur route geometry ke liye OSRM public services use hote hain. Internet zaroori hai; public endpoints par usage limits lagu hoti hain.
- Driver position foreground GPS updates ke hisaab se refresh hoti hai; background tracking, turn-by-turn voice navigation, aur guaranteed live delivery service shamil nahi hain.
- Driver registration licence/vehicle numbers store karti hai, lekin document images upload ya manual verification nahi karti.
- Cash fare completion par history/earning ledger mein record hota hai; wallet balance aur payment gateway nahi hai.
- OTP local testing mode mein backend se mil sakta hai. Iske liye `OTP_DEV_MODE=true` hona chahiye.
- Booking aur account data ke liye MongoDB chalna chahiye. API ke `/health` endpoint mein `database.connected` ko `true` hona chahiye.

## Local setup

Backend `backend/.env` mein valid MongoDB Atlas URI use karta hai. Atlas network access list mein development machine ka IP allow hona chahiye. Local OTP ke liye `OTP_DEV_MODE=true` rakhein.
