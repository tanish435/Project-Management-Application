'use client'
import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ChevronLeft, X } from 'lucide-react'
import { PopoverClose } from '@radix-ui/react-popover'
import { Label } from './ui/label'
import axios, { AxiosError } from 'axios'
import { ApiResponse } from '@/utils/ApiResponse'
import { toast } from 'sonner'
import { Attachment } from '@/types/interface'

interface Props {
    cardId: string
    file: Attachment
    setAttachments: React.Dispatch<React.SetStateAction<Attachment[]>>;
}

const FileAttachmentModifyPopover = ({ cardId, file, setAttachments }: Props) => {
    const [isSelectActive, setIsSelectActive] = useState(true)
    const [isEditActive, setIsEditActive] = useState(false)
    // const [isDeleteActive, setIsDeleteActive] = useState(false)

    const [newName, setNewName] = useState(file.name)

    const updateFile = async () => {
        try {
            const response = await axios.patch(`/api/attachments/updateAttachmentName/${cardId}/${file._id}`, {
                name: newName
            })

            console.log("linkkk", response.data)

            if (response.data.success) {
                setAttachments(prev =>
                    prev.map(att => att._id === response.data.data._id ? response.data.data : att)
                )
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            const errMsg = axiosError.response?.data.message

            toast.error('Failed to update attachment', {
                description: errMsg
            })
        }
    }

    const deleteFile = async () => {
        try {
            const response = await axios.delete(`/api/attachments/deleteAttachment/${cardId}/${file._id}`)

            console.log("linkk deleted", response.data)

            if (response.data.success) {
                setAttachments(prev =>
                    prev.filter(att => att._id !== file._id)
                )
            }
        } catch (error) {
            const axiosError = error as AxiosError<ApiResponse>
            const errMsg = axiosError.response?.data.message

            toast.error('Failed to delete attachment', {
                description: errMsg
            })
        }
    }

    const getDownloadUrl = (url: string) => {
        if (url.includes("cloudinary.com") && url.includes("/upload/")) {
            return url.replace("/upload/", "/upload/fl_attachment/");
        }
        return url;
    };


    return (
        <div className="p-3 bg-slate-800 border border-slate-700 rounded">
            {isSelectActive ? (
                <div className="flex flex-col gap-2">
                    <div
                        className="flex items-center justify-start w-full rounded hover:bg-slate-700 p-2 text-sm cursor-pointer"
                        onClick={() => {
                            setIsSelectActive(false)
                            setIsEditActive(true)
                        }}
                    >
                        Edit
                    </div>
                    <a
                        href={getDownloadUrl(file.url)}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1"
                    >

                        <div
                            className="flex items-center justify-start w-full rounded hover:bg-slate-700 p-2 text-sm cursor-pointer"
                        >
                            Download
                        </div>
                    </a>
                    <div
                        className="flex items-center justify-start w-full rounded hover:bg-slate-700 p-2 text-sm cursor-pointer"
                        onClick={() => {
                            setIsSelectActive(false)
                            // setIsDeleteActive(true)
                        }}
                    >
                        Delete
                    </div>
                </div>
            ) : isEditActive ? (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                setIsEditActive(false)
                                setIsSelectActive(true)
                            }}
                            className="w-8 hover:bg-gray-700 h-auto"
                        >
                            <ChevronLeft className="text-gray-400" />
                        </Button>
                        <div className="flex-1 text-center">
                            <span className="text-gray-300 text-sm">Edit attachment</span>
                        </div>
                        <PopoverClose asChild>
                            <Button variant="ghost" className="w-8 hover:bg-gray-700 h-auto">
                                <X className="h-4 w-4 text-gray-400" />
                            </Button>
                        </PopoverClose>
                    </div>

                    <Label htmlFor="name" className='font-bold text-gray-400'>File name</Label>
                    <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="bg-slate-900 mb-2 mt-1 ring-1"
                    />
                    <Button onClick={updateFile} className="w-full mt-2 text-sm">
                        Update
                    </Button>
                </div>
            ) : (
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <Button
                            variant="ghost"
                            onClick={() => {
                                // setIsDeleteActive(false)
                                setIsSelectActive(true)
                            }}
                            className="w-8 hover:bg-gray-700 h-auto"
                        >
                            <ChevronLeft className="text-gray-400" />
                        </Button>
                        <div className="flex-1 text-center">
                            <span className="text-gray-300 text-sm">Delete file</span>
                        </div>
                        <PopoverClose asChild>
                            <Button variant="ghost" className="w-8 hover:bg-gray-700 h-auto">
                                <X className="h-4 w-4 text-gray-400" />
                            </Button>
                        </PopoverClose>
                    </div>
                    <p className="text-sm text-gray-300 mb-4">Are you sure you want to delete this file?</p>
                    <Button
                        className="w-full text-sm"
                        variant="destructive"
                        onClick={deleteFile}
                    >
                        Delete
                    </Button>
                </div>
            )}
        </div>
    )
}

export default FileAttachmentModifyPopover
