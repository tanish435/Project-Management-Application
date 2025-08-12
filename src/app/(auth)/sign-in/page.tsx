'use client'
import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { signInSchema } from '@/schemas/signInSchema'
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn, useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import Link from 'next/link'

const Page = () => {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])

  const router = useRouter()

  const {data: session} = useSession()
  const username = session?.user?.username


  const form = useForm<z.infer<typeof signInSchema>>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      identifier: '',
      password: ''
    }
  })

  const onSubmit = async (data: z.infer<typeof signInSchema>) => {
    const result = await signIn('credentials', {
      redirect: false,
      identifier: data.identifier,
      password: data.password
    })

    console.log(result);

    if (result?.error) {
      if (result.error === 'CredentialsSignIn') {
        toast('Login Failed', {
          description: 'Incorrect username or password',
        })
      } else {
        toast('Error', {
          description: result.error,
        })
      }
    }

    if (result?.url) {
      router.replace(`/u/${username}/boards`) // Pending: dont know actually where to redirect
    }
  }


  return (
    <div className='flex items-center justify-center h-screen'>
      {mounted && <Card className='px-3 py-2 w-1/4 flex flex-col shadow-lg'>
        <CardHeader>
          <CardTitle className='text-3xl text-center'>
            Name
          </CardTitle>
          <CardDescription className='text-sm text-gray-500 text-center font-normal'>
            Sign in to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="identifier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username or email address</FormLabel>
                    <FormControl>
                      <Input placeholder="" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem className='!mt-3'>
                    <FormLabel>Password</FormLabel>
                    <FormControl>
                      <Input type='password' placeholder="" {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className='flex items-center justify-center'>
                <Button className='w-full' type="submit">Sign in</Button>
              </div>
            </form>
          </Form>

          <div className='my-3'>
            <p>
              Don&apos;t have an account? <Link href={'/sign-up'} className='text-blue-600 underline'>
                Sign up
              </Link>

            </p>
          </div>

          <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border my-4">
            <span className="relative z-10 bg-background px-2 text-muted-foreground">or</span>
          </div>

          <Button className='w-full my-1' variant={'outline'} onClick={() => signIn('google')}>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg> Sign in with Google
          </Button>
        </CardContent>

      </Card>}
    </div>
  )
}

export default Page