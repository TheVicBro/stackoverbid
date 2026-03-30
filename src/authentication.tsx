import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

//Gather token response

type TokenResponse = {
  access_token: string
  token_type: "bearer" | string
  links?: Array<{ rel: string; href: string; method: string }>
}

//Obtain list of errors in order to display them in the frontend

type ErrorList = {
  detail?: Array<{
    loc?: Array<string | number>
    msg?: string
    type?: string
  }> | string
}

function getErrorMessage(err: unknown) {
  if (!err || typeof err !== "object") return "Request failed"

  const maybe = err as ErrorList
  const detail = maybe.detail

  // Display singular error message
  if (typeof detail === "string" && detail.trim()) {
    return detail
  }

  // Display multiple error messages if needed
  if (Array.isArray(detail)) {
    const messages = detail
      .map((e) => e?.msg)
      .filter((m): m is string => typeof m === "string" && m.trim().length > 0)

    if (messages.length > 0) return messages.join("\n")
  }

  return "Request failed"
}

export default function Authentication(props: { onAuthed?: () => void }) {
  
  const API_BASE = useMemo(() => {
    return (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api"
  }, [])

  // Login or sign up mode
  const [mode, setMode] = useState<"login" | "signup">("login")
  const [loading, setLoading] = useState(false)

  // Error and success
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Login/sign up fields
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")

  // Sign up fields
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [address, setAddress] = useState("")

  async function apiJson<T>(path: string, init: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw data
    return data as T
  }


  // Function for submission of login or sign up info

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setLoading(true)

    try {

      //Login mode
      if (mode === "login") {
        await apiJson<TokenResponse>("/auth/login", {
          method: "POST",
          body: JSON.stringify({ username, password }),
        })
        props.onAuthed?.()
        return
      }

      //Sign up mode
      await apiJson("/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          username,
          password,
          first_name: firstName,
          last_name: lastName,
          address,
        }),
      })

        setSuccess("Welcome to StackOverbid! You can now log in.")

    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-stone-100 text-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 space-y-4">
          <div className="space-y-1">
            <h1 className="text-xl font-bold">
              {mode === "login" ? "Sign in" : "Create account"}
            </h1>
            <p className="text-sm text-gray-500">
              {mode === "login"
                ? "Use your StackOverbid credentials."
                : "Fill out the required details to sign up."}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant={mode === "login" ? "default" : "outline"}
              onClick={() => setMode("login")}
              className="flex-1"
            >
              Sign In
            </Button>
            <Button
              type="button"
              variant={mode === "signup" ? "default" : "outline"}
              onClick={() => setMode("signup")}
              className="flex-1"
            >
              Register
            </Button>
          </div>

          <Separator />

          <form onSubmit={onSubmit} className="space-y-3">
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoComplete="username"
            />
            <Input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />

            {mode === "signup" && (
              <>
                <Input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="First name"
                  autoComplete="given-name"
                />
                <Input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Last name"
                  autoComplete="family-name"
                />
                <Input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Address"
                  autoComplete="street-address"
                />
              </>
            )}

            {success && (
                <div className="text-sm text-green-600 whitespace-pre-line">{success}</div>
            )}

            {error && (
                <div className="text-sm text-red-600 whitespace-pre-line">{error}</div>
            )}

            <Button disabled={loading} type="submit" className="w-full bg-orange-500 hover:bg-orange-400">
              {loading ? "Working..." : mode === "login" ? "Sign In" : "Register"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
