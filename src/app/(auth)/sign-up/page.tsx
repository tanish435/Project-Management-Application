'use client'
import React, { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { signUpSchema } from '@/schemas/signUpSchema'
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from 'next-auth/react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useDebounceCallback } from 'usehooks-ts'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import Link from 'next/link'
import axios, { AxiosError } from 'axios'
import { ApiResponse } from '@/utils/ApiResponse'

const page = () => {
    const router = useRouter()
    const [isMounted, setIsMounted] = useState(false)
    const [username, setUsername] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isCheckingUsername, setIsCheckingUsername] = useState(false)
    const [usernameMessage, setUsernameMessage] = useState('')

    const debounced = useDebounceCallback(setUsername, 500)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    useEffect(() => {
        const checkUniqueUsername = async () => {
            if (username) {
                setIsCheckingUsername(true)
                setUsernameMessage('')

                try {
                    const response = await axios.get(`/api/users/check-username-unique?username=${username}`)
                    setUsernameMessage(response.data.message)
                } catch (error) {
                    const axiosError = error as AxiosError<ApiResponse>
                    setUsernameMessage(axiosError.response?.data.message as string)
                } finally {
                    setIsCheckingUsername(false)
                }
            }
        }

        checkUniqueUsername()
    }, [username])

    const form = useForm<z.infer<typeof signUpSchema>>({
        resolver: zodResolver(signUpSchema),
        defaultValues: {
            fullName: '',
            username: '',
            email: '',
            password: ''
        }
    })

    const onSubmit = async (data: z.infer<typeof signUpSchema>) => {
        setIsSubmitting(true)

        try {
            const response = await axios.post('/api/users/signup', data)
            console.log(response);

            if (response.status === 200) {
                toast(response.data.message)
            }

            router.replace(`/verify/${username}`)
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            let errorMsg = axiosError.response?.data.message
            toast("Error signing up the user", {
                description: errorMsg
            })
        } finally {
            setIsSubmitting(false)
        }
    }


    return (
        <div className='flex items-center justify-center h-screen mt-10'>
            {isMounted && <Card className='px-3 py-2 w-1/4 flex flex-col shadow-lg'>
                <CardHeader>
                    <CardTitle className='text-3xl text-center'>
                        Name
                    </CardTitle>
                    <CardDescription className='text-sm mb-0 text-gray-500 text-center font-normal'>
                        Create your account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem className='!mt-0'>
                                        <FormLabel>Full name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="username"
                                render={({ field }) => (
                                    <FormItem className='!mt-3'>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input placeholder="" {...field}
                                                onChange={(e) => {
                                                    field.onChange(e)
                                                    debounced(e.target.value)
                                                }}
                                            />
                                        </FormControl>
                                        {isCheckingUsername && <Loader2 className='animate-spin' />}
                                        <p className={`${usernameMessage === "Username is available" ? "text-green-500" : "text-red-500"} text-sm`}>{usernameMessage}</p>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem className='!mt-3'>
                                        <FormLabel>Email address</FormLabel>
                                        <FormControl>
                                            <Input type='email' placeholder="" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="password"
                                render={({ field }) => (
                                    <FormItem className='!mt-4'>
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
                                <Button className='w-full' type="submit" disabled={isSubmitting}>
                                    {
                                        isSubmitting ? (
                                            <>
                                                <Loader2 className='mr-2 h-3 w-3 animate-spin' /> Please wait
                                            </>
                                        )  : ('Sign up')
                                    }
                                </Button>
                            </div>
                        </form>
                    </Form>

                    <div className='my-3'>
                        <p>
                            Already have an account? <Link href={'/sign-in'} className='text-blue-600 underline'>
                                Sign in
                            </Link>

                        </p>
                    </div>

                    <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border my-4">
                        <span className="relative z-10 bg-background px-2 text-muted-foreground">or</span>
                    </div>

                    <Button className='w-full ' variant={'outline'} onClick={() => signIn('google')}>
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
                        </svg> Sign up with Google
                    </Button>
                </CardContent>

            </Card>}
        </div>
    )
}

export default page