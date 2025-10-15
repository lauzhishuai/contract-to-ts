import * as vscode from 'vscode'
import path = require('path')
import { InterfaceItem } from '../TreeItem/InterfaceItem'

export const deleteInterface = (intf: InterfaceItem) => {
  if (!intf) {
    return
  }
  const { method } = intf || {}
  const { methodUri, methodName, projectName } = method || {}
  vscode.window
    .showInformationMessage(
      `确定要删除接口 ${methodName}(${projectName}) 吗？`,
      {
        modal: true,
      },
      {
        title: '确认',
        value: true,
      }
    )
    .then((res) => {
      if (!res?.value) {
        return
      }
      try {
        vscode.workspace.fs.delete(methodUri, { recursive: true })
      } catch (e) {
        vscode.window.showErrorMessage(
          `删除接口 ${methodName}(${projectName}) 失败：${e}, 请手动删除对应接口目录`
        )
      }
    })
}
