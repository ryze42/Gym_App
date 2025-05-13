import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { VscAccount } from "react-icons/vsc";
import { fetchAPI } from "../api.mjs";
import { useAuthenticate } from "../authentication/useAuthenticate";

function ProfileView() {
  const navigate = useNavigate();
  const authKey = localStorage.getItem("authKey");

  const [id, setId] = useState(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [originalRole, setOriginalRole] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [updated, setUpdated] = useState(false);

  useEffect(() => {
    if (!authKey) {
      navigate("/authenticate");
    }
  }, [authKey, navigate]);

  const loadProfile = useCallback(async () => {
    try {
      const res = await fetchAPI("GET", "/user/self", null, authKey);
      if (res.status === 200) {
        const { id: userId, first_name, last_name, email: userEmail, role: userRole } = res.body;
        setId(userId);
        setFirstName(first_name);
        setLastName(last_name);
        setEmail(userEmail);
        setRole(userRole);
        setOriginalRole(userRole);
      } else {
        setError(res.body.message || "Failed to load profile");
      }
    } catch (err) {
      setError(err.toString());
    }
  }, [authKey]);

  useEffect(() => {
    if (authKey) {
      loadProfile();
    }
  }, [authKey, loadProfile]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    try {
      const body = {
        id,
        first_name: firstName,
        last_name: lastName,
        email,
        role,
        ...(password && { password }),
      };
      const res = await fetchAPI("PUT", "/user/self", body, authKey);
      if (res.status === 200) {
        setSuccess("Profile updated successfully.");
        setPassword("");
        setUpdated(true);
      } else {
        setError(res.body.message || "Update failed");
      }
    } catch (err) {
      setError(err.toString());
    }
  };

  const canEditRole = originalRole === "admin" && !updated;

  return (
    <main className="min-h-screen flex items-center justify-center bg-base-200 p-4">
      <div className="card w-full max-w-md shadow-xl bg-base-100 p-6 flex flex-col items-center">
        <VscAccount className="text-8xl text-primary mb-2" />
        <h2 className="text-lg font-semibold text-center mb-4">Edit Profile</h2>

        {error && <div className="alert alert-error mb-4 w-full">{error}</div>}
        {success && <div className="alert alert-success mb-4 w-full">{success}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
          <input
            type="text"
            placeholder="First Name"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="input input-bordered w-full"
          />

          <input
            type="text"
            placeholder="Last Name"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="input input-bordered w-full"
          />

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input input-bordered w-full"
          />

          {canEditRole ? (
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              required
              className="select select-bordered w-full"
            >
              <option value="" disabled>Select Role</option>
              <option value="admin">Admin</option>
              <option value="member">Member</option>
              <option value="trainer">Trainer</option>
            </select>
          ) : (
            <input
              type="text"
              value={role}
              disabled
              className="input input-bordered w-full bg-gray-100"
            />
          )}

          <input
            type="password"
            placeholder="New Password (leave blank to keep current)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input input-bordered w-full"
          />

          <button type="submit" className="btn btn-primary w-full">
            Update Details
          </button>
        </form>
      </div>
    </main>
  );
}

export default ProfileView;
