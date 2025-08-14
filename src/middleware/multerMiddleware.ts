import { Request, Response } from 'express'
import multer, { StorageEngine } from 'multer'

const storage: StorageEngine = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, '../../public/temp')
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname)
    }
})

export const upload = multer({storage})


export const multerMiddleware = (req: Request, res: Response) => {
    const uploadAny = upload.any()
    return new Promise<void> ((resolve, reject) => {
        uploadAny(req, res, (err) => {
            if(err) {
                console.log("Multer error: ", err);
                reject(err)
            } else {
                resolve()
            }
        })
    })
}