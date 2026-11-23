import React from 'react'
import ComponentTypes from '@theme-original/NavbarItem/ComponentTypes'
import AuthNavbarItem from '@site/src/components/auth/AuthNavbarItem'

const CustomComponentTypes = {
  ...ComponentTypes,
  'custom-auth': AuthNavbarItem,
} as typeof ComponentTypes & Record<string, React.ComponentType<any>>

export default CustomComponentTypes
