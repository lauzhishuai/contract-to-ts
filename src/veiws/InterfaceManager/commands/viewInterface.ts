import { Uri, ViewColumn, window, workspace } from 'vscode'
import { InterfaceItem } from '../TreeItem/InterfaceItem'
import path = require('path')
import { getConfig } from '../../../utils'
import { Config } from '../../../constants'

export const viewInterface = (intf: InterfaceItem) => {
  const { methodUri } = intf.method || {}
  if (!methodUri) {
    return window.showErrorMessage('查看接口失败！')
  }

  const typesUri = Uri.joinPath(methodUri, 'index.ts')

  workspace.openTextDocument(typesUri).then((doc) => {
    window.showTextDocument(doc, { viewColumn: ViewColumn.One })
  })
}
