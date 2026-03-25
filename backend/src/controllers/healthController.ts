import { Request, Response } from 'express'

export const healthCheck = async (req: Request, res: Response) => {
  res.status(200).json({ 
    success: true, 
    status: 'healthy',
    timestamp: new Date().toISOString()
  })
}
