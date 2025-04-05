import { ApiResponse } from '@/utils/ApiResponse';
import axios, { AxiosError } from 'axios';
import { Ellipsis, Star } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Button } from './ui/button';

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
}

interface Board {
  name: string,
  bgColor: string,
  url: string,
  _id: string,
  isStarred: boolean
}

const BoardNavbar = ({ _id, boardName, members }: NavbarProps) => {
  const [starredBoards, setStarredBoards] = useState<Board[]>([])
  const [isStarred, setIsStarred] = useState(false)

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
    starredBoards.map((board) => board._id === _id ? setIsStarred(true) : false)
  }, [starredBoards])

  return (
    <div className='w-full'>

    <div className='flex justify-between items-center p-3'>
      <div className='flex items-center justify-center gap-4'>
        <div className='text-lg font-bold ml-6'>{boardName}</div>
        {isStarred ? (
          <Star fill='yellow' strokeWidth={0.5} className='h-4 w-4 mr-3' />
        ) : (
          <Star className='h-4 w-4 mr-3' />
        )}
      </div>

      <div className='flex items-center gap-1'>
        {members && members.map((member) => (
          <Avatar key={member._id} className='h-7 w-7'>
            <AvatarImage src={member.avatar as string} alt={member.username} className='' />
            <AvatarFallback>{member.initials}</AvatarFallback>
          </Avatar>
        ))}

        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className='hover:bg-transparent'> 
                <Ellipsis  />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Menu</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Billing
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Keyboard shortcuts
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem>Team</DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>Invite users</DropdownMenuSubTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem>Email</DropdownMenuItem>
                      <DropdownMenuItem>Message</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>More...</DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuPortal>
                </DropdownMenuSub>
                <DropdownMenuItem>
                  New Team
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>GitHub</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuItem disabled>API</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
     </div>
  )
}

export default BoardNavbar