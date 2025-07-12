'use client'

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import axios, { AxiosError } from 'axios'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { ApiResponse } from '@/utils/ApiResponse'
import { descriptionSchema } from '@/schemas/cardSchema'
import { commentSchema } from '@/schemas/commentSchema'

interface User {
  _id: string,
  fullName: string,
  username: string;
  email: string;
  avatar: string;
  initials: string
}

interface Comment {
  _id: string
  content: string
  owner: User
  card: string
  createdAt: string
  updatedAt: string
}

interface CommentEditorProps {
  cardId: string
  onCancel: () => void
  setComments: React.Dispatch<React.SetStateAction<any[]>>;
  setIsAddCommentActive?: React.Dispatch<React.SetStateAction<any>>;
  isEditing?: boolean
  commentToEdit?: Comment | null
}

const CommentEditor = ({
  cardId,
  onCancel,
  setComments,
  setIsAddCommentActive,
  isEditing = false,
  commentToEdit
}: CommentEditorProps) => {

  const form = useForm<z.infer<typeof commentSchema>>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: `${isEditing && commentToEdit ? commentToEdit.content : ''}`,
    },
  })

  const onSubmit = async (data: z.infer<typeof commentSchema>) => {
    try {
      if (isEditing && commentToEdit) {
        const response = await axios.patch(`/api/comments/updateComment/${cardId}/${commentToEdit._id}`, {
          content: data.content,
        })

        console.log("updaateee", response.data); 
        

        if (response.data.success) {
          setComments(prev =>
            prev.map(c => (c._id === commentToEdit._id ? response.data.data : c))
          )
          onCancel()
        }
      } else {
        const response = await axios.post(`/api/comments/addComment/${cardId}`, {
          content: data.content,
        })

        if (response.data.success) {
          setComments(prev => [...prev, response.data.data])
          setIsAddCommentActive?.(false)
        }
      }

    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>
      const errMsg = axiosError.response?.data.message

      toast.error('Failed to add comment', {
        description: errMsg,
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-3">
        <FormField
          name="content"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Add comment"
                  className="bg-gray-800 border-gray-400 resize-none h-10 w-full"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="submit" className='bg-blue-400 hover:bg-[#75b2fb] text-black px-3 py-1.5'>
            {isEditing ? 'Update' : 'Save'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} className='hover:bg-[#5f6671] px-3'>
            {isEditing ? 'Discard Changes' : 'Cancel'}
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default CommentEditor
