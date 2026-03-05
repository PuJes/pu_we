'use server'

import config from '@payload-config'
import { handleServerFunctions } from '@payloadcms/next/layouts'
import type { ServerFunctionClient } from 'payload'

import { importMap } from './importMap'

const internalServerFunction = async (args: Parameters<ServerFunctionClient>[0]) =>
  handleServerFunctions({
    ...args,
    config,
    importMap,
  })

export const serverFunction: ServerFunctionClient = internalServerFunction
