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
import { Loader2, Mail, CheckCircle, XCircle } from "lucide-react"
import { useForm } from 'react-hook-form'
import * as z from 'zod'
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from 'sonner'
import { useRouter, useParams } from 'next/navigation'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import Link from 'next/link'
import axios, { AxiosError } from 'axios'
import { ApiResponse } from '@/utils/ApiResponse'

const verifySchema = z.object({
    code: z.string().min(6, 'Verification code must be 6 digits').max(6, 'Verification code must be 6 digits')
})

const Page = () => {
    const router = useRouter()
    const params = useParams<{ username: string }>()
    const [isMounted, setIsMounted] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const [resendTimer, setResendTimer] = useState(0)
    const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle')

    useEffect(() => {
        setIsMounted(true)
    }, [])

    // Resend timer countdown
    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [resendTimer])

    const form = useForm<z.infer<typeof verifySchema>>({
        resolver: zodResolver(verifySchema),
        defaultValues: {
            code: ''
        }
    })

    const onSubmit = async (data: z.infer<typeof verifySchema>) => {
        setIsSubmitting(true)
        setVerificationStatus('idle')

        try {
            const response = await axios.post('/api/users/verify-code', {
                username: params.username,
                code: data.code
            })

            if (response.status === 200) {
                setVerificationStatus('success')
                toast.success('Email verified successfully!')
                
                // Redirect to sign-in page after successful verification
                setTimeout(() => {
                    router.replace('/sign-in')
                }, 2000)
            }
        } catch (error) {
            setVerificationStatus('error')
            const axiosError = error as AxiosError<ApiResponse>
            const errorMsg = axiosError.response?.data.message || 'Verification failed'
            
            toast.error('Verification failed', {
                description: errorMsg
            })
        } finally {
            setIsSubmitting(false)
        }
    }

    const resendVerificationCode = async () => {
        if (resendTimer > 0) return

        setIsResending(true)
        
        try {
            const response = await axios.post('/api/users/resend-verification', {
                username: params.username
            })

            if (response.status === 200) {
                toast.success('Verification code sent successfully!')
                setResendTimer(60) // Start 60-second cooldown
                form.reset() // Clear the current code
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            const errorMsg = axiosError.response?.data.message || 'Failed to resend code'
            
            toast.error('Failed to resend code', {
                description: errorMsg
            })
        } finally {
            setIsResending(false)
        }
    }

    const getStatusIcon = () => {
        switch (verificationStatus) {
            case 'success':
                return <CheckCircle className="w-6 h-6 text-green-500" />
            case 'error':
                return <XCircle className="w-6 h-6 text-red-500" />
            default:
                return <Mail className="w-6 h-6 text-blue-500" />
        }
    }

    const getStatusMessage = () => {
        switch (verificationStatus) {
            case 'success':
                return 'Email verified successfully! Redirecting to sign in...'
            case 'error':
                return 'Verification failed. Please check your code and try again.'
            default:
                return `We've sent a verification code to your email address.`
        }
    }

    return (
        <div className='flex items-center justify-center h-screen mt-10'>
            {isMounted && (
                <Card className='px-3 py-2 w-1/4 flex flex-col shadow-lg'>
                    <CardHeader className="text-center">
                        <div className="flex justify-center mb-4">
                            {getStatusIcon()}
                        </div>
                        <CardTitle className='text-3xl'>
                            Verify Your Email
                        </CardTitle>
                        <CardDescription className='text-sm mb-0 text-gray-500 font-normal'>
                            {getStatusMessage()}
                        </CardDescription>
                        {params.username && (
                            <p className="text-sm text-muted-foreground mt-2">
                                Account: <span className="font-semibold">{params.username}</span>
                            </p>
                        )}
                    </CardHeader>

                    <CardContent>
                        {verificationStatus !== 'success' && (
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="code"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Verification Code</FormLabel>
                                                <FormControl>
                                                    <Input 
                                                        placeholder="Enter 6-digit code" 
                                                        {...field}
                                                        maxLength={6}
                                                        className="text-center text-lg tracking-wider"
                                                        disabled={isSubmitting}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />

                                    <Button 
                                        className='w-full' 
                                        type="submit" 
                                        disabled={isSubmitting}                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className='mr-2 h-4 w-4 animate-spin' /> 
                                                Verifying...
                                            </>
                                        ) : (
                                            'Verify Email'
                                        )}
                                    </Button>
                                </form>
                            </Form>
                        )}

                        {verificationStatus === 'success' && (
                            <div className="text-center py-4">
                                <div className="text-green-600 mb-4">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-lg font-semibold">Verification Complete!</p>
                                </div>
                                <Button 
                                    className="w-full" 
                                    onClick={() => router.push('/sign-in')}
                                >
                                    Continue to Sign In
                                </Button>
                            </div>
                        )}

                        {verificationStatus !== 'success' && (
                            <>
                                <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border my-6">
                                    <span className="relative z-10 bg-background px-2 text-muted-foreground">
                                        Didn&apos;t receive the code?
                                    </span>
                                </div>

                                <Button 
                                    className='w-full' 
                                    variant='outline' 
                                    onClick={resendVerificationCode}
                                    disabled={isResending || resendTimer > 0}
                                >
                                    {isResending ? (
                                        <>
                                            <Loader2 className='mr-2 h-4 w-4 animate-spin' /> 
                                            Sending...
                                        </>
                                    ) : resendTimer > 0 ? (
                                        `Resend in ${resendTimer}s`
                                    ) : (
                                        'Resend Code'
                                    )}
                                </Button>
                            </>
                        )}

                        <div className='mt-6 text-center'>
                            <p className="text-sm text-muted-foreground">
                                Wrong email address?{' '}
                                <Link href='/sign-up' className='text-blue-600 underline hover:text-blue-800'>
                                    Sign up again
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

export default Page