import { ApiResponse } from '@/utils/ApiResponse';
import axios, { AxiosError } from 'axios';
import { Ellipsis, Star, UserMinus, UserPlus } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Button } from './ui/button';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './ui/alert-dialog';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

interface User {
  _id: string,
  fullName: string,
  username: string;
  email: string;
  avatar: string;
  initials: string
}

interface NavbarProps {
  _id: string
  boardName: string
  members: User[]
  onMembersUpdate?: (members: User[]) => void
}

interface Board {
  name: string,
  bgColor: string,
  url: string,
  _id: string,
  isStarred: boolean
}

const BoardNavbar = ({ _id, boardName, members: initialMembers, onMembersUpdate }: NavbarProps) => {
  const router = useRouter()
  const { data: session } = useSession()
  const username = session?.user?.username

  const [starredBoards, setStarredBoards] = useState<Board[]>([])
  const [isStarred, setIsStarred] = useState(false)
  const [isToggling, setIsToggling] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)
  const [members, setMembers] = useState<User[]>(initialMembers || [])
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Add state for email input and dialog
  const [inviteEmail, setInviteEmail] = useState('')
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [userToRemove, setUserToRemove] = useState<User | null>(null)
  const { slug } = useParams<{ slug: string }>()

  // Update local members when props change
  useEffect(() => {
    setMembers(initialMembers || [])
  }, [initialMembers])

  useEffect(() => {
    const fetchStarredBoards = async () => {
      try {
        const response = await axios.get('/api/boards/getStarredBoards')
        setStarredBoards(response.data.data.boards)

      } catch (error) {
        console.log("Error fetching starred boards");
        const axiosError = error as AxiosError<ApiResponse>
        const errMsg = axiosError.response?.data.message

        toast.error('Failed to fetch starred boards', {
          description: errMsg
        })
      }
    }

    fetchStarredBoards()
  }, [])

  useEffect(() => {
    const isCurrentBoardStarred = starredBoards?.some(board => board._id === _id)
    setIsStarred(isCurrentBoardStarred || false)
  }, [starredBoards, _id])

  // Listen for synchronization events from other components
  useEffect(() => {
    const handleBoardStarredToggle = (event: CustomEvent) => {
      const { boardId, isStarred: newStarredStatus } = event.detail

      if (boardId === _id) {
        setIsStarred(newStarredStatus)
      }
    }

    window.addEventListener('boardStarredToggle', handleBoardStarredToggle as EventListener)

    return () => {
      window.removeEventListener('boardStarredToggle', handleBoardStarredToggle as EventListener)
    }
  }, [_id])

  const deleteBoard = async () => {
    if (isDeleting) return
  
    setIsDeleting(true)
  
    try {
      const response = await axios.delete(`/api/boards/deleteBoard/${_id}/${slug}`)
  
      if (response.data.success) {
        toast.success(response.data.message)
        // Close dialog before navigation
        setIsDeleteDialogOpen(false)
        setIsDeleting(false)
        
        if(username) {
          router.push(`/u/${username}/boards`)
        } else {
          router.push('/')
        }
      }
    } catch (error) {
      console.log("Error deleting board", error);
      const axiosError = error as AxiosError<ApiResponse>
      const errMsg = axiosError.response?.data.message
  
      toast.error('Failed to delete board', {
        description: errMsg
      })
      setIsDeleting(false)
    }
  }

  const toggleStarredStatus = async () => {
    if (isToggling) return // Prevent multiple simultaneous requests

    setIsToggling(true)

    try {
      const response = await axios.patch(`/api/boards/toggleBoardStarredStatus/${_id}`)

      if (response.data.success) {
        const newStarredStatus = response.data.data.isStarred
        setIsStarred(newStarredStatus)

        // Update the starredBoards list
        if (newStarredStatus) {
          // Add current board to starred list (we don't have full board data, so we'll refetch)
          const starredResponse = await axios.get('/api/boards/getStarredBoards')
          setStarredBoards(starredResponse.data.data.boards)
        } else {
          // Remove from starred list
          setStarredBoards(prev => prev.filter(board => board._id !== _id))
        }

        // Dispatch custom event for cross-component synchronization
        window.dispatchEvent(new CustomEvent('boardStarredToggle', {
          detail: { boardId: _id, isStarred: newStarredStatus }
        }))

        toast.success(response.data.message)
      }
    } catch (error) {
      console.log("Error toggling starred status", error);
      const axiosError = error as AxiosError<ApiResponse>
      const errMsg = axiosError.response?.data.message

      toast.error('Failed to update starred status', {
        description: errMsg
      })
    } finally {
      setIsToggling(false)
    }
  }

  const inviteUser = async (email: string) => {
    if (isInviting) return // Prevent multiple simultaneous requests

    setIsInviting(true)

    try {
      const response = await axios.patch(`/api/boards/addBoardMembers/${_id}`, {
        email
      })

      if (response.data.success) {
        toast.success(response.data.message)

        // If user was added (not just invited), update the members list
        if (response.data.data && response.data.data.updatedMembers) {
          const updatedMembers = response.data.data.updatedMembers
          setMembers(updatedMembers)
          onMembersUpdate?.(updatedMembers)
        }

        // Reset form and close dialog
        handleDialogClose()
      }
    } catch (error) {
      console.log("Error inviting user", error);
      const axiosError = error as AxiosError<ApiResponse>
      const errMsg = axiosError.response?.data.message

      toast.error('Failed to invite user', {
        description: errMsg
      })
    } finally {
      setIsInviting(false)
    }
  }

  const removeMember = async (userId: string) => {
    if (isRemoving) return

    setIsRemoving(true)

    try {
      const response = await axios.patch(`/api/boards/removeBoardMembers/${_id}`, {
        userId
      })

      if (response.data.success) {
        toast.success(response.data.message)

        // Update the members list immediately
        const updatedMembers = response.data.data.updatedMembers || members.filter(member => member._id !== userId)
        setMembers(updatedMembers)
        onMembersUpdate?.(updatedMembers)

        setUserToRemove(null)
      }
    } catch (error) {
      console.log("Error removing user", error);
      const axiosError = error as AxiosError<ApiResponse>
      const errMsg = axiosError.response?.data.message

      toast.error('Failed to remove user', {
        description: errMsg
      })
    } finally {
      setIsRemoving(false)
    }
  }

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!inviteEmail || !emailRegex.test(inviteEmail)) {
      toast.error('Please enter a valid email address')
      return
    }

    inviteUser(inviteEmail)
  }

  const handleDialogClose = () => {
    setInviteEmail('')
    setIsDialogOpen(false)

    // Force cleanup of any modal overlays
    setTimeout(() => {
      // Remove any leftover modal overlays
      const overlays = document.querySelectorAll('[data-radix-popper-content-wrapper]')
      overlays.forEach(overlay => overlay.remove())

      // Reset focus and scroll
      document.body.focus()
      document.body.style.overflow = 'auto'
      document.body.style.pointerEvents = 'auto'
    }, 100)
  }

  const handleDeleteDialogClose = () => {
    setIsDeleteDialogOpen(false)
    setIsDeleting(false) // Reset deleting state when canceling
    
    // Force cleanup of any modal overlays
    setTimeout(() => {
      // Remove any leftover modal overlays
      const overlays = document.querySelectorAll('[data-radix-popper-content-wrapper]')
      overlays.forEach(overlay => overlay.remove())
      
      // Reset focus and scroll
      document.body.focus()
      document.body.style.overflow = 'auto'
      document.body.style.pointerEvents = 'auto'
    }, 100)
  }
  

  const MemberAvatar = ({ member }: { member: User }) => (
    <TooltipProvider key={member._id}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="relative group cursor-pointer">
            <Avatar className='h-8 w-8 border-2 hover:border-gray-300 transition-colors'>
              <AvatarImage src={member.avatar} alt={member.fullName} />
              <AvatarFallback className="text-xs font-medium">
                {member.initials}
              </AvatarFallback>
            </Avatar>

            {/* Remove button overlay */}
            <Button
              variant="destructive"
              size="sm"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => setUserToRemove(member)}
              title={`Remove ${member.fullName}`}
            >
              <UserMinus className="h-3 w-3" />
            </Button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <div className="text-center">
            <div className="font-medium">{member.fullName}</div>
            <div className="text-xs text-gray-500">@{member.username}</div>
            <div className="text-xs text-gray-500">{member.email}</div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )

  return (
    <div className='w-full'>
      <div className='flex justify-between items-center p-3'>
        <div className='flex items-center justify-center gap-4'>
          <div className='text-lg font-bold ml-6'>{boardName}</div>
          <Button
            variant="ghost"
            size="sm"
            className="p-1 h-auto hover:bg-gray-600 rounded"
            onClick={toggleStarredStatus}
            disabled={isToggling}
            title={isStarred ? "Remove from starred boards" : "Add to starred boards"}
          >
            {isStarred ? (
              <Star
                fill='yellow'
                strokeWidth={0.5}
                className={`h-4 w-4 transition-opacity ${isToggling ? 'opacity-50' : ''}`}
              />
            ) : (
              <Star
                className={`h-4 w-4 transition-opacity hover:fill-yellow-200 ${isToggling ? 'opacity-50' : ''}`}
              />
            )}
          </Button>
        </div>

        <div className='flex items-center gap-2'>
          <div className="flex items-center -space-x-2">
            {members && members.map((member) => (
              <MemberAvatar key={member._id} member={member} />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="hover:bg-transparent">
                  <Ellipsis />
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Board Menu</DropdownMenuLabel>
                <DropdownMenuSeparator />

                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setIsDialogOpen(true)}>
                    Invite Users
                  </DropdownMenuItem>
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Support</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setIsDeleteDialogOpen(true)}>
                    Delete Board
                  </DropdownMenuItem>

                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Invite Dialog */}
          {isDialogOpen && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Invite Users via Email</DialogTitle>
                  <DialogDescription>
                    Send an invitation link to users via email.
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleInviteSubmit}>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="invite-email">Email Address</Label>
                      <Input
                        id="invite-email"
                        name="invite-email"
                        placeholder="user@example.com"
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        autoFocus
                        autoComplete="off"
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter className="mt-4">
                    <Button
                      variant="outline"
                      type="button"
                      // onClick={() => {
                      //   setInviteEmail('')
                      //   setIsDialogOpen(false)
                      // }}
                      onClick={handleDialogClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={isInviting}
                    >
                      {isInviting ? 'Sending...' : 'Send Invite'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}

          {/* Remove User Confirmation Dialog */}
          <AlertDialog open={!!userToRemove} onOpenChange={(open) => !open && setUserToRemove(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove User</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to remove <strong>{userToRemove?.fullName}</strong> from this board?
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => userToRemove && removeMember(userToRemove._id)}
                  disabled={isRemoving}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isRemoving ? 'Removing...' : 'Remove User'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Delete board alert dialog */}
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => {
            if (!open) handleDeleteDialogClose()
          }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Board</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete <strong>{boardName}</strong>?
                  This action will remove all lists, cards, comments, and attachments associated with it.
                  This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={handleDeleteDialogClose} disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={deleteBoard}
                  disabled={isDeleting}
                  className="bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Board'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

        </div>
      </div>
    </div>
  )
}

export default BoardNavbar