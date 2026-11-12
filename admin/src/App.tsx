import { useState, useCallback } from 'react'
import { BrowserRouter } from 'react-router-dom'
import { AppRoutes } from './routes/AppRoutes'

export function App() {
  const [token, setToken] = useState<string>(() => localStorage.getItem('adminToken') || '')

  const handleLogin = useCallback((newToken: string) => {
    localStorage.setItem('adminToken', newToken)
    setToken(newToken)
  }, [])

  const handleLogout = useCallback(() => {
    localStorage.removeItem('adminToken')
    setToken('')
  }, [])

  return (
    <BrowserRouter>
      <AppRoutes token={token} onLogin={handleLogin} onLogout={handleLogout} />
    </BrowserRouter>
  )
}

export default App
