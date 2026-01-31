import configPromise from '@payload-config'
import { getPayload } from 'payload'

// ✅ This tells Next.js to skip pre-rendering this route during the build
export const dynamic = 'force-dynamic' 

export const GET = async (request: Request) => {
  const payload = await getPayload({
    config: configPromise,
  })

  return Response.json({
    message: 'This is an example of a custom route.',
  })
}