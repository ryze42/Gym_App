import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { fetchAPI } from "../api.mjs"
import { useNavigate } from "react-router"

export const AuthenticationContext = createContext(null)

export function AuthenticationProvider({ children }) {
    const [user, setUser] = useState(null)
    const [status, setStatus] = useState("resuming")

    useEffect(() => {
        const authenticationKey = localStorage.getItem("authKey")

        if (authenticationKey) {
            fetchAPI("GET", "/user/self", null, authenticationKey)
                .then(response => {
                    setUser(response.body)
                    setStatus("loaded")
                })
                .catch(error => {
                    setStatus(null)
                })
        } else {
            setStatus(null)// chnage to updated github version ( should be "...")
        }
    }, [setUser, setStatus])

    return <AuthenticationContext.Provider value={[user, setUser, status, setStatus]}>
        {children}
    </AuthenticationContext.Provider>
}

export function useAuthenticate(restrictToRoles = null) {
    const [user, setUser, status, setStatus] = useContext(AuthenticationContext)

    const getUser = useCallback((authenticationKey) => {
        if (authenticationKey) {
            setStatus("loading")
            fetchAPI("GET", "/user/self", null, authenticationKey)
                .then(response => {
                    setUser(response.body)
                    setStatus("loaded")
                })
                .catch(error => {
                    setStatus("invalid key")
                })
        }
    }, [setUser, setStatus])

    const login = useCallback((username, password) => {
        const body = {
            username,
            password
        }

        setStatus("authenticating")
        fetchAPI("POST", "/authenticate", body)
            .then(response => {
                if (response.status == 200) {
                    const authenticationKey = response.body.key
                    localStorage.setItem("authKey", authenticationKey)
                    getUser(response.body.key)
                    setStatus("loaded")
                } else {
                    setStatus(response.body.message)
                }
                console.log(response)
            })
            .catch(error => {
                console.error(error)
                setStatus(error)
            })
    }, [setStatus, getUser])

    const logout = useCallback(() => {
        fetchAPI("DELETE", "/authenticate", null, user.authenticationKey)
            .then(response => {
                setUser(null)
                localStorage.removeItem("authKey")
            })
    }, [setUser, user])

    const refresh = useCallback(() => {
        getUser(user.authenticationKey)
    }, [user, getUser])

    const navigate = useNavigate()

    useEffect(() => {
        if (restrictToRoles
            && status != "resuming"
            && (!user || !restrictToRoles.includes(user.role))) {
            navigate("/")
        }
    }, [user, status, restrictToRoles, navigate])

    return {user,login,logout,refresh,status,}
}