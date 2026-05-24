import { useEffect, useState, useRef } from "react";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { useNavigate } from "react-router-dom";

export function Signin() {
  const navigate = useNavigate();
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string[]>([]);
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard");
    }
  }, []);
  async function signin() {
    setError([]);
    setFieldErrors({});
    const email = emailRef.current?.value.trim();
    const password = passwordRef.current?.value;

    const nextFieldErrors: { email?: string; password?: string } = {};
    if (!email) nextFieldErrors.email = "Email is required";
    if (!password) nextFieldErrors.password = "Password is required";
    if (Object.keys(nextFieldErrors).length > 0) {
      setFieldErrors(nextFieldErrors);
      return;
    }

    try {
      const response = await axios.post(BACKEND_URL + "/api/v1/signin", {
        email,
        password,
      });
      const jwt = response.data.token;
      localStorage.setItem("token", jwt);
      navigate("/dashboard");
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
      setError(["Incorrect credentials"]);
    }
  }
  return (
       <div className=" signup-bg h-screen w-screen bg-black flex justify-center items-center">
            <div className="blur-ellipse"></div>
            <div className="fixed max-w-82 m-2 w-full border border-gray-300/20 shadow-md bg-[#303060]/20 rounded-lg p-6 ">
                <div className="flex flex-col  mt-6 gap-y-10">
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
                        <div className="mt-1 text-xs text-red-400">{fieldErrors.email}</div>
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
                        <div className="mt-1 text-xs text-red-400">{fieldErrors.password}</div>
                      )}
                    </div>
                </div>
                <div className="flex justify-center items-center mt-15">
                    <Button variant="primary" text="Signin" size="full" onClick={signin} loading={false} />
                </div>
                <div className="mt-2 flex justify-center items-center text-gray-400">
                    Don't have an account? <span className="text-blue-500 cursor-pointer ml-2" onClick={() => navigate("/signup")}>Signup</span>
                </div>
        {error.length > 0 && (
          <div className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 p-3">
            <ul className="list-disc list-inside text-red-400 text-sm space-y-1">
              {error.map((errMsg, index) => (
                <li key={index}>{errMsg}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
