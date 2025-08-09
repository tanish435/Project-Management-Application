'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useSession } from 'next-auth/react'
import axios, { AxiosError } from 'axios'
import { toast } from 'sonner'
import { ApiResponse } from '@/utils/ApiResponse'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Camera,
  Loader2,
  Save,
  User,
  Mail,
  Edit3,
  Check,
  X,
  Upload
} from 'lucide-react'

interface UserData {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  avatar?: string;
  initials: string;
}

const ProfilePage = () => {
  const { data: session, update: updateSession } = useSession()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    fullName: ''
  })
  const [originalData, setOriginalData] = useState({
    username: '',
    fullName: ''
  })

  // Validation states
  const [usernameError, setUsernameError] = useState('')
  const [isCheckingUsername, setIsCheckingUsername] = useState(false)
  const [usernameValid, setUsernameValid] = useState(false)

  // Avatar states
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      setLoading(true)
      const response = await axios.get('/api/users/getCurrentUser')
      const user = response.data.data
      
      setUserData(user)
      setFormData({
        username: user.username,
        fullName: user.fullName
      })
      setOriginalData({
        username: user.username,
        fullName: user.fullName
      })
      setPreviewUrl(user.avatar || '')
      
    } catch (error) {
      console.error('Error fetching user data:', error)
      const axiosError = error as AxiosError<ApiResponse>
      toast.error('Failed to fetch user data', {
        description: axiosError.response?.data.message
      })
    } finally {
      setLoading(false)
    }
  }

  const checkUsernameUnique = async (username: string) => {
    if (username === originalData.username) {
      setUsernameValid(true)
      setUsernameError('')
      return
    }

    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters')
      setUsernameValid(false)
      return
    }

    try {
      setIsCheckingUsername(true)
      const response = await axios.get(`/api/users/check-username-unique?username=${username}`)
      
      if (response.data.success) {
        setUsernameValid(true)
        setUsernameError('')
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>
      setUsernameError(axiosError.response?.data.message || 'Username not available')
      setUsernameValid(false)
    } finally {
      setIsCheckingUsername(false)
    }
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))

    if (field === 'username') {
      const timeoutId = setTimeout(() => {
        checkUsernameUnique(value)
      }, 500)

      return () => clearTimeout(timeoutId)
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB')
        return
      }

      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file')
        return
      }

      setSelectedFile(file)
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    }
  }

  const handleAvatarUpload = async () => {
    if (!selectedFile || !userData) return

    try {
      setUploadingAvatar(true)
      const formData = new FormData()
      formData.append('avatar', selectedFile)
      formData.append('userId', userData._id)

      const response = await axios.patch('/api/users/changeAvatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })

      const newAvatarUrl = response.data.data
      setUserData(prev => prev ? { ...prev, avatar: newAvatarUrl } : null)
      setSelectedFile(null)
      
      // Update session data
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          image: newAvatarUrl
        }
      })

      toast.success('Avatar updated successfully')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      const axiosError = error as AxiosError<ApiResponse>
      toast.error('Failed to update avatar', {
        description: axiosError.response?.data.message
      })
      
      // Reset preview on error
      if (userData?.avatar) {
        setPreviewUrl(userData.avatar)
      }
      setSelectedFile(null)
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!userData) return

    if (formData.username !== originalData.username && !usernameValid) {
      toast.error('Please choose a valid username')
      return
    }

    try {
      setSaving(true)
      const response = await axios.patch('/api/users/updateUserProfile', {
        username: formData.username,
        fullName: formData.fullName,
        userId: userData._id
      })

      const updatedUser = response.data.data
      setUserData(prev => prev ? { ...prev, ...updatedUser } : null)
      setOriginalData({
        username: formData.username,
        fullName: formData.fullName
      })

      // Update session data
      await updateSession({
        ...session,
        user: {
          ...session?.user,
          username: updatedUser.username,
          name: updatedUser.fullName
        }
      })

      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      const axiosError = error as AxiosError<ApiResponse>
      toast.error('Failed to update profile', {
        description: axiosError.response?.data.message
      })
    } finally {
      setSaving(false)
    }
  }

  const hasChanges = () => {
    return formData.username !== originalData.username || 
           formData.fullName !== originalData.fullName ||
           selectedFile !== null
  }

  const resetChanges = () => {
    setFormData(originalData)
    setSelectedFile(null)
    if (userData?.avatar) {
      setPreviewUrl(userData.avatar)
    }
    setUsernameError('')
    setUsernameValid(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!userData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="w-96">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Failed to load user data. Please try again.
            </p>
            <Button onClick={fetchUserData} className="w-full mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
          <p className="text-muted-foreground mt-2">
            Manage your account settings and profile information.
          </p>
        </div>

        <Separator />

        {/* Avatar Section */}
        {/* Fix upload on cloudinary issue */}
        <Card className='bg-gray-800'>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              Profile Picture
            </CardTitle>
            <CardDescription>
              Update your profile picture. Recommended size: 400x400px
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={previewUrl} alt={userData.username} />
                  <AvatarFallback className="text-lg">
                    {userData.initials}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  variant="outline"
                  className="absolute -bottom-2 -right-2 rounded-full h-8 w-8 p-0"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                >
                  <Upload className="h-3 w-3" />
                </Button>
              </div>

              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                  >
                    Choose File
                  </Button>
                  {selectedFile && (
                    <Button
                      onClick={handleAvatarUpload}
                      disabled={uploadingAvatar}
                    >
                      {uploadingAvatar ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Save className="h-4 w-4 mr-2" />
                      )}
                      Save Avatar
                    </Button>
                  )}
                </div>
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {selectedFile.name}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">
                  JPG, PNG or GIF. Max size 5MB.
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </CardContent>
        </Card>

        {/* Profile Information */}
        <Card className='bg-gray-800'>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Update your personal information and username.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Email (Read-only) */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                value={userData.email}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Your email address cannot be changed.
              </p>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  placeholder="Enter your username"
                  className={usernameError ? 'border-red-500' : ''}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  {isCheckingUsername && (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                  {!isCheckingUsername && formData.username !== originalData.username && (
                    <>
                      {usernameValid ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <X className="h-4 w-4 text-red-500" />
                      )}
                    </>
                  )}
                </div>
              </div>
              {usernameError && (
                <p className="text-sm text-red-500">{usernameError}</p>
              )}
              {usernameValid && formData.username !== originalData.username && (
                <p className="text-sm text-green-600">Username is available!</p>
              )}
            </div>

            {/* Full Name */}
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            {/* Action Buttons */}
            {hasChanges() && (
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  onClick={handleSaveProfile}
                  disabled={saving || (formData.username !== originalData.username && !usernameValid)}
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={resetChanges}
                  disabled={saving}
                >
                  Cancel
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default ProfilePage