import bcrypt from "bcrypt";

export const hashPassword = (password: string) => {
    return new Promise((resolve, reject) => {
        bcrypt.genSalt(12, (err, salt) => {
            if (err) {
                reject(err)
            }
            bcrypt.hash(password, salt, (err, hash) => {
                if (err) {
                    reject(err)
                }
                resolve(hash)
            })
        })
    })
}

// password from frontend and hash from database
export const comparePassword = (password: string, hash: any) => {
    return bcrypt.compare(password, hash)
}