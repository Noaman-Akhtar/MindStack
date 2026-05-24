import { useEffect, useRef, useState } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { useNavigate } from "react-router-dom";

export function Signup() {
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, []);

  async function signup() {
    setError([]);
    setFieldErrors({});

    const email = emailRef.current?.value.trim();
    const password = passwordRef.current?.value;

    const nextFieldErrors: {
      email?: string;
      password?: string;
    } = {};

    if (!email) nextFieldErrors.email = "Email is required";
    if (!password) nextFieldErrors.password = "Password is required";

    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    try {
      await axios.post(BACKEND_URL + "/api/v1/signup", {
        email,
        password,
      });
      navigate("/signin");
    } catch (err: any) {
      const data = err?.response?.data;

      if (data?.errors && Array.isArray(data.errors)) {
        setError(data.errors);
        return;
      }

      if (data?.message && typeof data.message === "string") {
        setError([data.message]);
        return;
      }

      setError(["Signup failed. Please try again."]);
    }
  }

  return (
    <div className="signup-bg h-screen w-screen bg-black flex justify-center items-center px-4">
      <div className="blur-ellipse"></div>
      <div className="fixed w-full max-w-90 border border-gray-300/20 shadow-xl bg-[#303060]/20 rounded-lg p-6">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-white">Create account</h1>
          <p className="mt-1 text-sm text-gray-400">Start saving your ideas in MindStack</p>
        </div>

        <div className="flex flex-col gap-y-6">
          <div>
            <Input
              variant="secondary"
              ref={emailRef}
              placeholder="Email"
              type="email"
              onChange={() => {
                setError([]);
                setFieldErrors((prev) => ({ ...prev, email: undefined }));
              }}
            />
            {fieldErrors.email && (
              <div className="mt-1 text-xs text-red-400">
                {fieldErrors.email}
              </div>
            )}
          </div>

          <div>
            <Input
              variant="secondary"
              ref={passwordRef}
              placeholder="Password"
              type="password"
              onChange={() => {
                setError([]);
                setFieldErrors((prev) => ({ ...prev, password: undefined }));
              }}
            />
            {fieldErrors.password && (
              <div className="mt-1 text-xs text-red-400">
                {fieldErrors.password}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-center items-center mt-8">
          <Button
            variant="primary"
            text="Signup"
            size="full"
            onClick={signup}
            loading={false}
          />
        </div>

        <div className="mt-4 flex justify-center items-center text-sm text-gray-400">
          Already have an account?{" "}
          <span
            className="text-blue-400 hover:text-blue-300 cursor-pointer ml-2"
            onClick={() => navigate("/signin")}
          >
            Signin
          </span>
        </div>

        {error.length > 0 && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-md p-3 mt-4">
            <ul className="text-red-400 text-sm space-y-1">
              {error.map((err, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">*</span>
                  <span>{err}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
