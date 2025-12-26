'use client'

import {NextStudio} from 'next-sanity/studio'
import config from '../../../../sanity.config'

export const dynamic = 'force-static'

export {metadata} from 'next-sanity/studio/metadata'
export {viewport} from 'next-sanity/studio/viewport'

export default function StudioPage() {
  return <NextStudio config={config} />
}
