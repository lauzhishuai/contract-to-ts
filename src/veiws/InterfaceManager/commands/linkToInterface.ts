import * as vscode from 'vscode'
import { InterfaceItem } from '../TreeItem/InterfaceItem'

export const linkToInterface = async (intf: InterfaceItem) => {
  if (!intf) {
    return
  }
  try {
    const { version, methodName, projectId } = intf.method || {}
    const url = `http://contract.mobile.flight.ctripcorp.com/#/operation-detail/${projectId}/${version}/${methodName}?lang=zh-CN`
    await vscode.env.openExternal(vscode.Uri.parse(url))
  } catch (e) {
    vscode.window.showErrorMessage(e.message)
  }
}
