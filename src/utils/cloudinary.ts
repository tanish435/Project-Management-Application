import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs'
import { ApiError } from './ApiError';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath: string) => {
    try {
        if (!localFilePath) {
            return null
        }

        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })

        fs.unlinkSync(localFilePath)
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        console.log('Error in uploading file in cloudinary, ' + error);
        throw new Error('Failed to upload on cloudinary')
    }
}

const deleteFromCloudinary = async (fileUrl: string) => {
    try {
        const extractPublicId = (url: string) => {
            const matches = url.match(/\/upload\/(?:v\d+\/)?([^\.\/]+)/);
            return matches ? matches[1] : null;
        }

        const publicId = extractPublicId(fileUrl)

        if (!publicId) {
            throw new ApiError(400, 'Failed to extract public ID from the file URI')
        }

        await cloudinary.uploader.destroy(publicId, (error) => {
            if (error) {
                throw new ApiError(error, "Failed to delete file from cloudinary")
            } else {
                console.log("File deleted from cloudinary")
            }
        })

    } catch (error) {
        console.log(error);
        throw new ApiError(500, 'Failed to delete from clouinary')
    }
}

export {uploadOnCloudinary, deleteFromCloudinary}