"use client";

import React, { useState, useEffect } from "react";
import Script from "next/script";
import { useAuth } from "./AuthContext";
import { Chrome, Shield, Sparkles, User, Mail, AlertCircle, X, Check } from "lucide-react";

export default function GoogleLoginButton() {
  const { loginWithGoogle } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isGsiLoaded, setIsGsiLoaded] = useState(false);
  const [showSandbox, setShowSandbox] = useState(false);
  const [customEmail, setCustomEmail] = useState("");
  const [customName, setCustomName] = useState("");
  const [loadingPersona, setLoadingPersona] = useState<string | null>(null);

  // Read environment variable
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "your-google-client-id";
  const isRealGoogleConfigured = 
    clientId !== "your-google-client-id" && 
    clientId.trim() !== "" && 
    !clientId.startsWith("YOUR_");

  // Persona list for sandbox testing
  const testPersonas = [
    { name: "Sarthak Acharya", email: "sarthak.ach@gmail.com", role: "Software Engineer" },
    { name: "Sarah Connor", email: "sarah.connor@cyberdyne.io", role: "AI Specialist" },
    { name: "John Doe", email: "john.doe@example.com", role: "Product Manager" },
  ];

  // Callback for real Google login
  const handleGoogleCallback = async (response: any) => {
    try {
      setError(null);
      await loginWithGoogle(response.credential, false);
    } catch (err: any) {
      setError(err.message || "Failed to log in with Google.");
    }
  };

  // Initialize GIS real button if configured
  useEffect(() => {
    if (isGsiLoaded && isRealGoogleConfigured) {
      try {
        const googleObj = (window as any).google;
        if (googleObj) {
          googleObj.accounts.id.initialize({
            client_id: clientId,
            callback: handleGoogleCallback,
          });
          googleObj.accounts.id.renderButton(
            document.getElementById("google-real-btn-container"),
            { 
              theme: "outline", 
              size: "large", 
              width: "100%",
              text: "continue_with",
              shape: "rectangular"
            }
          );
        }
      } catch (err) {
        console.error("Error rendering real Google GSI button:", err);
      }
    }
  }, [isGsiLoaded, isRealGoogleConfigured, clientId]);

  // Handle Mock Login click
  const handleMockLogin = async (persona: { name: string; email: string }) => {
    setLoadingPersona(persona.email);
    setError(null);
    try {
      // Simulate credential as "mock_google_id_token"
      await loginWithGoogle("mock_google_id_token", true, persona.email, persona.name);
      setShowSandbox(false);
    } catch (err: any) {
      setError(err.message || "Failed to log in with Mock Google.");
    } finally {
      setLoadingPersona(null);
    }
  };

  const handleCustomMockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail || !customName) {
      setError("Please fill in both fields.");
      return;
    }
    setLoadingPersona("custom");
    setError(null);
    try {
      await loginWithGoogle("mock_google_id_token", true, customEmail, customName);
      setShowSandbox(false);
    } catch (err: any) {
      setError(err.message || "Failed to log in with Mock Google.");
    } finally {
      setLoadingPersona(null);
    }
  };

  return (
    <div className="w-full">
      {/* Script Loader for Google Identity Services */}
      {isRealGoogleConfigured && (
        <Script
          src="https://accounts.google.com/gsi/client"
          onLoad={() => setIsGsiLoaded(true)}
          strategy="afterInteractive"
        />
      )}

      {/* Local Component Error Alert */}
      {error && (
        <div className="mb-4 flex items-start gap-2.5 rounded-lg bg-coral/10 p-3 text-xs font-semibold text-coral border border-coral/20">
          <AlertCircle size={16} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Button Render Choice */}
      {isRealGoogleConfigured ? (
        <div className="space-y-3">
          <div id="google-real-btn-container" className="w-full min-h-[44px]"></div>
          {/* Subtle Sandbox Fallback link */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => setShowSandbox(true)}
              className="text-[11px] font-bold uppercase tracking-wider text-moss hover:underline cursor-pointer opacity-70 hover:opacity-100 transition"
            >
              Open Sandbox Simulator
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowSandbox(true)}
          className="flex w-full h-11 items-center justify-center gap-3 rounded-lg border border-line bg-panel font-semibold text-sm text-ink transition hover:bg-shell hover:scale-[1.01] active:scale-[0.99] shadow-sm cursor-pointer relative overflow-hidden group"
        >
          {/* Subtle glow border effect */}
          <div className="absolute inset-0 border border-transparent group-hover:border-moss/20 rounded-lg transition-colors pointer-events-none"></div>
          <Chrome size={18} className="text-coral" />
          <span>Sign in with Google</span>
          <span className="flex h-2 w-2 rounded-full bg-gold animate-pulse absolute right-3 top-3" title="Sandbox mode active"></span>
        </button>
      )}

      {/* Sandbox Simulator Modal */}
      {showSandbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-fade-in">
          <div 
            className="w-full max-w-md rounded-2xl border border-line bg-panel p-6 shadow-soft transition-all duration-300 transform scale-100 flex flex-col gap-5 text-ink"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-gold/10 text-gold">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h3 className="font-extrabold text-base">Google Login Sandbox</h3>
                  <p className="text-[10px] font-bold text-moss uppercase tracking-wider">Local Mock Mode</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSandbox(false)}
                className="p-1 rounded-lg text-ink/40 hover:bg-shell hover:text-ink/80 transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Warning if Client ID is missing */}
            {!isRealGoogleConfigured && (
              <div className="flex items-start gap-2.5 rounded-lg bg-gold/10 p-3 text-[11px] font-medium text-ink/85 border border-gold/20 leading-relaxed">
                <Shield size={16} className="shrink-0 text-gold mt-0.5" />
                <span>
                  <strong>Developer Note:</strong> No Google Client ID is configured. The application is defaulting to Sandbox Mode so you can test authentication workflows seamlessly.
                </span>
              </div>
            )}

            {/* Test Personas Section */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-ink/60">
                Choose a Test Google Persona
              </label>
              <div className="grid gap-2">
                {testPersonas.map((persona) => (
                  <button
                    key={persona.email}
                    type="button"
                    disabled={loadingPersona !== null}
                    onClick={() => handleMockLogin(persona)}
                    className="flex items-center justify-between p-3 rounded-xl border border-line bg-shell/30 hover:bg-shell hover:border-moss/40 text-left transition duration-200 group disabled:opacity-50 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-moss/10 text-moss flex items-center justify-center font-bold text-sm uppercase group-hover:scale-105 transition-transform">
                        {persona.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold group-hover:text-moss transition-colors">
                          {persona.name}
                        </div>
                        <div className="text-xs text-ink/50 leading-none mt-0.5">{persona.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-line text-ink/75 group-hover:bg-moss group-hover:text-shell transition-colors">
                      {loadingPersona === persona.email ? "Simulating..." : persona.role}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-line/60"></div>
              <span className="flex-shrink mx-4 text-xs font-bold uppercase tracking-wider text-ink/35">Or enter custom</span>
              <div className="flex-grow border-t border-line/60"></div>
            </div>

            {/* Custom Input Form */}
            <form onSubmit={handleCustomMockSubmit} className="space-y-3">
              <div className="space-y-1">
                <label htmlFor="mockName" className="text-xs font-bold uppercase tracking-wider text-ink/60">
                  Full Name
                </label>
                <div className="relative rounded-lg">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink/40">
                    <User size={16} />
                  </div>
                  <input
                    id="mockName"
                    type="text"
                    required
                    placeholder="Alice Wonder"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="block w-full h-10 pl-9 pr-3 rounded-lg border border-line bg-shell/40 text-ink placeholder:text-ink/35 focus:outline-none focus:border-moss focus:ring-1 focus:ring-moss transition text-xs"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="mockEmail" className="text-xs font-bold uppercase tracking-wider text-ink/60">
                  Email Address
                </label>
                <div className="relative rounded-lg">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-ink/40">
                    <Mail size={16} />
                  </div>
                  <input
                    id="mockEmail"
                    type="email"
                    required
                    placeholder="alice@wonderland.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="block w-full h-10 pl-9 pr-3 rounded-lg border border-line bg-shell/40 text-ink placeholder:text-ink/35 focus:outline-none focus:border-moss focus:ring-1 focus:ring-moss transition text-xs"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loadingPersona !== null}
                className="flex w-full h-10 items-center justify-center gap-2 rounded-lg bg-ink text-shell font-semibold text-xs transition hover:bg-moss disabled:opacity-50 cursor-pointer shadow-sm mt-4"
              >
                {loadingPersona === "custom" ? "Simulating Login..." : "Simulate Custom Google Login"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
