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

interface CardDescriptionEditorProps {
  cardId: string
  currentDescription: string
  onDescriptionSaveSuccess: (updatedDescription: string) => void
  onCancel: () => void
}

const CardDescriptionEditor = ({
  cardId,
  currentDescription,
  onDescriptionSaveSuccess,
  onCancel,
}: CardDescriptionEditorProps) => {

  const form = useForm<z.infer<typeof descriptionSchema>>({
    resolver: zodResolver(descriptionSchema),
    defaultValues: {
      description: currentDescription,
    },
  })

  const onSubmit = async (data: z.infer<typeof descriptionSchema>) => {
    try {
      const response = await axios.patch(`/api/cards/updateCardDescription/${cardId}`, {
        description: data.description,
      })

      console.log(response?.data);
      

      if (response.data.success) {
        onDescriptionSaveSuccess(response.data.data.description)
      }
    } catch (error) {
      const axiosError = error as AxiosError<ApiResponse>
      const errMsg = axiosError.response?.data.message

      toast.error('Failed to add description', {
        description: errMsg,
      })
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="w-full space-y-6">
        <FormField
          name="description"
          control={form.control}
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Textarea
                  placeholder="Add a description"
                  className="bg-gray-800 border-gray-400 resize-none h-40 w-full"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2">
          <Button type="submit" className='bg-blue-400 hover:bg-[#75b2fb] text-black px-3 py-1.5'>Save</Button>
          <Button type="button" variant="ghost" onClick={onCancel} className='hover:bg-[#5f6671] px-3'>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}

export default CardDescriptionEditor
