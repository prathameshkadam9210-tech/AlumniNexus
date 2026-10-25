import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import crypto from 'crypto'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'avatars')
const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('avatar') as File | null
    const userId = formData.get('userId') as string | null

    if (!file || !userId) {
      return NextResponse.json({ error: 'File and userId are required' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only JPEG, PNG, GIF, and WebP images are allowed' }, { status: 400 })
    }

    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Image must be under 2MB' }, { status: 400 })
    }

    // Ensure upload directory exists
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true })
    }

    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `${userId}_${crypto.randomBytes(8).toString('hex')}.${ext}`
    const filepath = path.join(UPLOAD_DIR, filename)

    // Write file
    const bytes = await file.arrayBuffer()
    await writeFile(filepath, Buffer.from(bytes))

    const avatarUrl = `/uploads/avatars/${filename}`

    return NextResponse.json({ success: true, avatarUrl, message: 'Avatar uploaded successfully' })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
  }
}
