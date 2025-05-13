import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthenticate } from "./useAuthenticate";
import { fetchAPI } from "../api.mjs";

function LoginView() {
  const [isRegister, setIsRegister] = useState(false);
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login, status, user, setStatus} = useAuthenticate()


  useEffect(() => {
    if (!isRegister && user && status === "loaded") {
      navigate("/");
    }
  }, [user, status, isRegister, navigate]);

  const toggleForms = (e) => {
    e.preventDefault();
    setError(null);
    setIsRegister(prev => !prev);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      const response = await login(loginEmail, loginPassword);
      if (response.status !== 200) {
        setError(response.body?.message || "Login failed");
      }
    } catch (err) {
      setError(err.toString());
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    try {
      const body = {
        first_name: firstName,
        last_name: lastName,
        role: "member",
        email: registerEmail,
        password: registerPassword
      };
      const res = await fetchAPI("POST", "/authenticate/register", body, null);
      if (res.status === 201) {
        const loginRes = await fetchAPI("POST", "/authenticate", { email: registerEmail, password: registerPassword }, null);
        if (loginRes.status === 200) {
          localStorage.setItem("authKey", loginRes.body.key);
          navigate("/timetable");
        } else {
          navigate("/login");
        }
      } else {
        setError(res.body.message || "Registration failed");
      }
    } catch (err) {
      setError(err.toString());
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md shadow-xl bg-base-100 p-6">
        <h2 className="text-2xl font-bold text-center mb-4">
          {isRegister ? "Register" : "Login"}
        </h2>

        {error && (
          <div className="alert alert-error mb-4">
            {error}
          </div>
        )}

        <form onSubmit={isRegister ? handleRegister : handleLogin} className="flex flex-col gap-4">
          {isRegister && (
            <>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={e => setFirstName(e.target.value)}
                required
                className="input input-bordered w-full"
              />
              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={e => setLastName(e.target.value)}
                required
                className="input input-bordered w-full"
              />
            </>
          )}

          <input
            type="email"
            placeholder="Email"
            value={isRegister ? registerEmail : loginEmail}
            onChange={e => isRegister ? setRegisterEmail(e.target.value) : setLoginEmail(e.target.value)}
            required
            className="input input-bordered w-full"
          />

          <input
            type="password"
            placeholder="Password"
            value={isRegister ? registerPassword : loginPassword}
            onChange={e => isRegister ? setRegisterPassword(e.target.value) : setLoginPassword(e.target.value)}
            required
            className="input input-bordered w-full"
          />

          <button type="submit" className="btn btn-primary w-full">
            {isRegister ? "Register" : "Login"}
          </button>
        </form>

        <p className="text-center mt-4">
          {isRegister ? "Already have an account?" : "Don't have an account?"}{" "}
          <button onClick={toggleForms} className="text-primary underline">
            {isRegister ? "Login" : "Register"}
          </button>
        </p>
      </div>
    </main>
  );
}

export default LoginView;


