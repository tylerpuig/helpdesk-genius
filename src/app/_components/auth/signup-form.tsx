'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'

import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Label } from '~/components/ui/label'
import { signIn } from 'next-auth/react'
import { api } from '~/trpc/react'
import { useRouter } from 'next/navigation'

export function SignUpForm() {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const [userSignupDetails, setUserSignupDetails] = useState({
    email: '',
    password: '',
    name: ''
  })

  // const [confirmPassword, setConfirmPassword] = useState('')

  const signup = api.auth.signUp.useMutation({
    onSuccess: () => {
      router.push('/auth/login')
    }
  })

  return (
    <div className="mx-auto flex w-full flex-col space-y-6 sm:w-[350px]">
      <div className="flex flex-col space-y-2 text-center">
        <div className="mb-4"></div>
        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
        <p className="text-sm">
          Already have an account?{' '}
          <Link href="/auth/login" className="underline underline-offset-4 hover:text-primary">
            Login
          </Link>
        </p>
      </div>

      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-1">
          <div className="space-y-2">
            <Label htmlFor="firstName">Full name</Label>
            <Input
              onChange={(e) => {
                setUserSignupDetails((prevState) => ({
                  ...prevState,
                  name: e.target.value
                }))
              }}
              id="firstName"
              placeholder="John Doe"
              required
            />
          </div>
          {/* <div className="space-y-2">
            <Label htmlFor="lastName">Last name</Label>
            <Input id="lastName" placeholder="Doe" required />
          </div> */}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            onChange={(e) => {
              setUserSignupDetails((prevState) => ({
                ...prevState,
                email: e.target.value
              }))
            }}
            id="email"
            placeholder="m@example.com"
            type="email"
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              onChange={(e) => {
                setUserSignupDetails((prevState) => ({
                  ...prevState,
                  password: e.target.value
                }))
              }}
              id="password"
              type={showPassword ? 'text' : 'password'}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">{showPassword ? 'Hide password' : 'Show password'}</span>
            </Button>
          </div>
        </div>
        {/* <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>
          <div className="relative">
            <Input
              onChange={(e) => {
                setConfirmPassword(e.target.value)
              }}
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              required
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span className="sr-only">
                {showConfirmPassword ? 'Hide password' : 'Show password'}
              </span>
            </Button>
          </div>
        </div> */}
        <Button
          onClick={() => {
            console.log(userSignupDetails)
            signup.mutate(userSignupDetails)
          }}
          className="w-full"
        >
          Sign up
        </Button>
      </div>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* <Button variant="outline" className="w-full">
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.086-10.432h4.924c0-.558-.102-1.09-.287-1.596h-4.637v3.044h2.657c-.358 1.027-1.197 1.905-2.657 1.905-1.657 0-3-1.343-3-3s1.343-3 3-3c.795 0 1.523.32 2.057.84l1.797-1.797C13.05 6.915 11.655 6.3 10 6.3c-2.873 0-5.2 2.327-5.2 5.2s2.327 5.2 5.2 5.2c4.238 0 5.2-3.723 5.2-5.2 0-.414-.043-.732-.102-1.047h-6.184v2.115z"
              fill="currentColor"
            />
          </svg>
          Google
        </Button> */}
        <Button
          onClick={(e) => {
            e.preventDefault()
            signIn('discord', { redirectTo: '/dashboard' })
          }}
          variant="outline"
          className="w-full"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            fill="currentColor"
            className="bi bi-discord"
            viewBox="0 0 16 16"
          >
            <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
          </svg>
          Discord
        </Button>
      </div>

      <p className="px-8 text-center text-sm text-muted-foreground">
        By clicking continue, you agree to our{' '}
        <Link href="#" className="underline underline-offset-4 hover:text-primary">
          Terms of Service
        </Link>{' '}
        and{' '}
        <Link href="#" className="underline underline-offset-4 hover:text-primary">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  )
}
