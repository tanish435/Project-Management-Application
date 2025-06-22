import React from 'react'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Separator } from './ui/separator'
import { Label } from './ui/label'
import axios, { AxiosError } from 'axios'
import { ApiResponse } from '@/utils/ApiResponse'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { urlSchema } from '@/schemas/attachmentSchema'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form'

interface User {
  _id: string,
  fullName: string,
  username: string;
  email: string;
  avatar: string;
  initials: string
}

interface Attachment {
  _id: string;
  name: string;
  url: string;
  card: string
  isWebsiteLink: number;
  createdAt: string;
  updatedAt: string;
  attachedBy: User[]
}

interface props {
  cardId: string
  attachments: Attachment[]
  setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
}

const AddAttachmentPopover = ({ cardId, attachments, setAttachments }: props) => {
  const form = useForm<z.infer<typeof urlSchema>>({
    resolver: zodResolver(urlSchema),
    defaultValues: {
      url: '',
      displayName: ''
    },
  })

  const attachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await axios.post(`/api/attachments/attachFile/${cardId}`, formData, {
        headers: {
          "Content-Type": "multipart/form-data"
        }
      })

      if (response.data.success) {
        setAttachments(prev => [...prev, response.data.data])
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>
      const errMsg = axiosError.response?.data.message

      toast.error('Failed to attach file', {
        description: errMsg
      })
    }
  }

  const attachLink = async (data: z.infer<typeof urlSchema>) => {
    try {
      const response = await axios.post(`/api/attachments/attachLink/${cardId}`, {
        url: data.url,
        displayName: data.displayName
      })

      if (response.data.success) {
        setAttachments(prev => [...prev, response.data.data])
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>
      const errMsg = axiosError.response?.data.message

      toast.error('Failed to attach file', {
        description: errMsg
      })
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className='bg-gray-600 hover:bg-[#5f6671] py-1.5 font-normal rounded-sm'
        >
          Add
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 bg-gray-800 pointer-events-auto"
      >
        <div className='flex flex-col gap-2'>
          <div className='flex items-center justify-center'>Attach</div>
          <section>
            <h3>Attach a file from your computer</h3>
            <Input
              type='file'
              name='file'
              className='bg-gray-700'
              onChange={attachFile}
            />
          </section>

          <Separator className='bg-gray-600 my-3' />

          <Form {...form}>
            <form onSubmit={form.handleSubmit(attachLink)} className="w-full space-y-6">
              <FormField
                name="url"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Paste a link</FormLabel>
                    <FormControl>
                      <Input
                        id="link"
                        placeholder="paste a link"
                        className='bg-gray-900'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="displayName"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Text (optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Text to display"
                        className='bg-gray-900'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex gap-2">
                <Button type="submit" className='rounded-sm bg-blue-500 hover:bg-[#75b2fb] text-black px-3 py-1.5'>Insert</Button>
                <Button type="button" variant="ghost" className='hover:bg-[#5f6671] px-3'>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>

          
        </div>
      </PopoverContent>
    </Popover>
  )
}

export default AddAttachmentPopover


{/* <section className='flex flex-col gap-2'>
            <div>
              <Label htmlFor="link">Paste a link</Label>
              <Input
                id="link"
                placeholder="paste a link"
                className='bg-gray-900'
              />
            </div>

            <div>
              <Label htmlFor="link">Display Text (optional)</Label>
              <Input id="link" placeholder="Text to display"
                className='bg-gray-900'
              />
            </div>
          </section>

          <section>
            <div className="flex gap-2">
              <Button type="submit" className='rounded-sm bg-blue-500 hover:bg-[#75b2fb] text-black px-3 py-1.5'>Insert</Button>
              <Button type="button" variant="ghost" className='hover:bg-[#5f6671] px-3'>
                Cancel
              </Button>
            </div>
          </section> */}