import * as ElementPlusIconsVue from '@element-plus/icons-vue'

export const toPascalCase = (name) =>
  String(name)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_\-\s]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('')

export const getIconComponent = (iconName) => {
  if (!iconName) return null

  const raw = String(iconName).trim()
  const pascal = toPascalCase(raw)
  const aliasMap = {
    's-operation': 'Operation',
    operation: 'Operation',
    setting: 'Setting',
    menu: 'Menu',
    user: 'User',
    tools: 'Tools',
    platform: 'Platform'
  }
  const alias = aliasMap[raw.toLowerCase()]

  return (
    ElementPlusIconsVue[raw] || ElementPlusIconsVue[pascal] || (alias ? ElementPlusIconsVue[alias] : null) || 'Menu'
  )
}

export const filterHiddenMenus = (menus = []) =>
  menus
    .filter((menu) => menu.IsHidden !== true && menu.IsHidden !== 1)
    .map((menu) => ({
      ...menu,
      children: menu.children && menu.children.length > 0 ? filterHiddenMenus(menu.children) : menu.children
    }))

export const flattenMenus = (menus = []) => {
  const flatMenus = []
  const walk = (nodes) => {
    ;(nodes || []).forEach((node) => {
      flatMenus.push(node)
      if (node.children && node.children.length) {
        walk(node.children)
      }
    })
  }

  walk(menus)
  return flatMenus
}

export const getRootMenus = (menus = []) => menus.filter((item) => item.pid === 0)

export const getMenuTitleByPath = (menus = [], path = '') => {
  const cleanPath = path.startsWith('/') ? path.substring(1) : path

  const found = flattenMenus(menus).find((menu) => menu.path === cleanPath)
  return found ? found.MenuName || found.menuName || '未命名' : '页面'
}

export const findChildrenByMenuId = (menus = [], menuId) => {
  const targetId = parseInt(menuId)

  for (const menu of menus) {
    if (menu.id === targetId) {
      return menu.children || []
    }
    if (menu.children && menu.children.length > 0) {
      const result = findChildrenByMenuId(menu.children, targetId)
      if (result && result.length > 0) {
        return result
      }
    }
  }

  return []
}

export const resolveInitialMenuState = (menus = [], currentPath = '') => {
  const fatherMenuList = getRootMenus(menus)
  const normalizedPath = currentPath.startsWith('/') ? currentPath.slice(1) : currentPath
  const flatMenus = flattenMenus(menus)
  const byId = {}

  flatMenus.forEach((menu) => {
    if (menu && menu.id !== undefined) {
      byId[menu.id] = menu
    }
  })

  const matched = flatMenus.find((menu) => menu && menu.path === normalizedPath)
  const climbToRoot = (menu) => {
    let current = menu
    while (current && current.pid !== 0 && current.pid !== '0' && byId[current.pid]) {
      current = byId[current.pid]
    }
    return current
  }

  if (matched) {
    const root = climbToRoot(matched)
    if (root && root.id !== undefined) {
      return {
        activeTopMenu: root.id + '',
        childrenMenuList: findChildrenByMenuId(menus, root.id)
      }
    }
  }

  if (fatherMenuList.length > 0) {
    return {
      activeTopMenu: '',
      childrenMenuList: findChildrenByMenuId(menus, fatherMenuList[0].id)
    }
  }

  return {
    activeTopMenu: '',
    childrenMenuList: []
  }
}
