import _ from 'lodash'

var TextWriter = function () {
  var self = this
  self.__Text = ''
  self.writeIndent = function (count) {
    for (var i = 0; i < count; i++) {
      self.__Text = self.__Text.concat(' ')
    }
  }
  self.writeLine = function (data) {
    self.__Text = self.__Text.concat(data).concat('\n')
  }
  self.write = function (data) {
    self.__Text = self.__Text.concat(data)
  }
  self.toString = function () {
    return self.__Text
  }
  self.clear = function () {
    self.__Text = ''
  }
}

var BaseWriter = function () {
  var self = this
  self.__TextWriter = new TextWriter()
  self.__ComplexClassDic = {}
  self.__ComplexClassList = []
  self.cacheComplexClass = function (data) {
    if (!data || !data.model || !data.model.name) {
      return
    }
    var name = data.model.name
    if (this.__ComplexClassDic[name]) {
      return
    }
    this.__ComplexClassList.push(data)
    this.__ComplexClassDic[name] = 1
  }
  self.hasComplexClassCache = function (key) {
    return this.__ComplexClassDic[key] === 1
  }
  self.__EnumDic = {}
  self.__EnumList = []
  self.cacheEnumType = function (data) {
    if (!data || !data.model || !data.model.name) {
      return
    }
    var key = data.model.name
    if (this.__EnumDic[key]) {
      return
    }
    this.__EnumList.push(data)
    this.__EnumDic[key] = 1
  }
  self.hasEnumCache = function (key) {
    return this.__EnumDic[key] === 1
  }
  self.toString = function () {
    return self.__TextWriter.toString()
  }
  self.clear = function () {
    self.__TextWriter.clear()
    self.__ComplexClassDic = {}
    self.__ComplexClassList = []
    self.__EnumDic = {}
    self.__EnumList = []
  }
  self.isPrimitive = function (type) {
    switch (type.toLocaleLowerCase()) {
      case 'string':
      case 'boolean':
      case 'float':
      case 'double':
      case 'decimal':
      case 'duration':
      case 'datetime':
      case 'time':
      case 'date':
      case 'integer':
      case 'long':
      case 'int':
      case 'short':
      case 'byte':
      case 'unsignedlong':
      case 'unsignedint':
      case 'unsignedshort':
      case 'unsignedbyte':
      case 'binary':
        return true
      default:
        return false
    }
  }
  var size = 50
  self.splitComment = function (comment) {
    var text = comment.replace(/\n/g, '')
    var len = text.length
    var ret = []
    var start = 0
    while (len > 0) {
      ret.push(text.substr(start, size))
      start += size
      len -= size
    }
    return ret
  }
}

var TSWriter = function () {
  var self = this
  // TODO 生成默认值 配置开关、默认关闭
  self.needDefaultValue = false
  // TODO 使用长名字 配置开关、默认关闭
  self.needLongName = false
  self.needSpecialFormat = false
  self.needExport = true
  self.needCameCase = true
  self.specialDate = true
  self.generateOptions = null
  self.preWrite = function () {
    if (self.needSpecialFormat) {
      self.__TextWriter.writeLine(
        '// tslint:disable jsdoc-format semicolon\n\n'
      )
    }
  }
  self.writeRequest = function (req) {
    self.writeComplexType(req, 0)
  }
  self.writeResponse = function (resp) {
    self.writeComplexType(resp, 0)
  }
  // 生成复杂接口类型
  self.writeComplexType = function (node, indent) {
    if (!node || !node.model) return
    var model = node.model
    var choice = (model.modelType & 8) === 8
    var belongElement = (model.modelType & 1) === 1
    const ignoredTypes =
      (self.generateOptions && self.generateOptions.ignoredTypes) || []
    if (belongElement && choice) {
      return
    }
    if (ignoredTypes.includes(model.name)) {
      return
    }
    self.__TextWriter.writeIndent(indent)
    if (self.needExport) {
      self.__TextWriter.write('export ')
    }
    self.__TextWriter.write('interface ' + formatInterfaceName(model.name))
    // 如果有继承信息
    if (node.extension && !self.isPrimitive(node.extension.model.name)) {
      self.__TextWriter.write(' extends ' + node.extension.model.name)
      self.cacheComplexClass(node.extension)
    }
    self.__TextWriter.writeLine(' {')

    // 子节点
    if (node.children && node.children.length > 0) {
      if (choice) {
        self.__TextWriter.writeIndent(indent + 2)
        self.__TextWriter.write('item: ')
        var len = node.children.length
        node.children.forEach(function (item, index) {
          if (item && item.model && item.field) {
            self.writeChoice(item)
            if (index < len - 1) {
              self.__TextWriter.write('|')
            }
          }
        })
        self.__TextWriter.writeLine(';')
      } else {
        node.children.forEach(function (item) {
          self.writeField(item, indent + 2)
        })
      }
    }
    self.__TextWriter.writeIndent(indent)
    self.__TextWriter.writeLine('}')
  }

  self.writeField = function (node, indent) {
    if (!node || !node.model || !node.field) return
    var field = node.field
    var model = node.model
    var choice = (model.modelType & 8) === 8
    var belongElement = (model.modelType & 1) === 1
    var fake = choice && belongElement
    var isPrimitiveType = self.isPrimitive(model.name)
    var isList = field.repeated == 1
    var isEnumType = model.enum
    var isMap = field.repeated === 3

    var hasChild = node.children && node.children.length > 0
    var hasEnumChild = node.enumerations && node.enumerations.length > 0
    if (isEnumType && hasEnumChild) {
      self.cacheEnumType(node)
    } else if (!isPrimitiveType && hasChild && !fake) {
      self.cacheComplexClass(node)
    }

    // 设置注释
    if (field.comment && field.comment.length > 0) {
      self.__TextWriter.writeIndent(indent)
      self.__TextWriter.writeLine('/**')
      var commentList = self.splitComment(field.comment)
      commentList.forEach(function (c) {
        self.__TextWriter.writeIndent(indent + 1)
        self.__TextWriter.writeLine('* ' + c)
      })
      self.__TextWriter.writeIndent(indent + 1)
      self.__TextWriter.writeLine('*/')
    }

    self.__TextWriter.writeIndent(indent)

    if (choice && belongElement && hasChild) {
      // 这段代码处理联合类型(choice)的情况
      // 遍历子节点生成字段名称,用Or连接
      node.children.forEach(function (item, index) {
        if (item && item.field) {
          self.__TextWriter.write(item.field.name)
          // @ts-ignore
          if (index < len - 1) {
            self.__TextWriter.write('Or') // 字段名之间用Or连接
          }
        }
      })
      self.__TextWriter.write(' : ')

      // 遍历子节点生成类型定义,用|连接
      node.children.forEach(function (item, index) {
        if (item && item.model && item.field) {
          self.writeChoice(item) // 写入每个选项的类型
          // @ts-ignore
          if (index < len - 1) {
            self.__TextWriter.write('|') // 类型之间用|连接
          }
        }
      })
    } else {
      var name = field.shortName
      if (self.needLongName || !name || name.length <= 0) name = field.name
      self.__TextWriter.write(camelCase(name))
      if (!field.required) {
        self.__TextWriter.write('?')
      }
      self.__TextWriter.write(' : ')
      var head = '',
        tail = ''

      var type = getType(model.name)
      if (isList) {
        head = ''
        tail = '[]'
      } else if (isMap) {
        head = '{[key:string]:'
        tail = ';}'
      } else if (
        !isPrimitiveType &&
        !(hasChild || self.hasComplexClassCache(model.name))
      ) {
        type = 'any'
      }

      if (isEnumType) {
        type =
          hasEnumChild || self.hasEnumCache(model.name) ? model.name : 'any'
      }

      self.__TextWriter.write(head + type + tail)
      if (self.needDefaultValue) {
        var defaultValue = getDefaultValue(type)
        if (!field.required) {
          defaultValue = 'null'
        } else if (isList) {
          defaultValue = '[]'
        }
        self.__TextWriter.write(' | ' + defaultValue)
      }
    }
    self.__TextWriter.writeLine(';')
  }

  self.writeChoice = function (node) {
    var field = node.field
    var model = node.model
    // 原始类型
    var isPrimitiveType = self.isPrimitive(model.name)
    var isList = field.repeated === 1
    var isEnumType = model.enum
    var isMap = field.repeated === 3
    var hasChild = node.children && node.children.length > 0
    var hasEnumChild = node.enumerations && node.enumerations.length > 0

    if (isEnumType && hasEnumChild) {
      self.cacheEnumType(node)
    } else if (!isPrimitiveType && hasChild) {
      self.cacheComplexClass(node)
    }

    var head = '',
      tail = ''
    var type = getType(model.name)
    if (isList) {
      head = ''
      tail = '[]'
    } else if (isMap) {
      head = '{[key:string]:'
      tail = ';}'
    } else if (
      !isPrimitiveType &&
      !(hasChild || self.hasComplexClassCache(model.name))
    ) {
      // 复杂类型设置为any
      type = 'any'
    }

    if (isEnumType) {
      type = hasEnumChild || self.hasEnumCache(model.name) ? model.name : 'any'
    }

    self.__TextWriter.write(head + type + tail)
  }

  self.writeCacheType = function () {
    var node
    while ((node = self.__ComplexClassList.pop())) {
      self.writeComplexType(node, 0)
    }
    while ((node = self.__EnumList.pop())) {
      self.writeEnumType(node, 0)
    }
  }

  self.writeEnumType = function (node, indent) {
    if (!node || !node.model) return
    var model = node.model
    self.__TextWriter.writeIndent(indent)
    self.__TextWriter.writeLine('enum ' + model.name + '{')
    var enumerations = node.enumerations
    if (enumerations && enumerations.length > 0) {
      var illegal = enumerations.find(
        (ee) => !!ee.name && (ee.name.includes('-') || ee.name.includes(' '))
      )
      enumerations.forEach(function (item) {
        // 注释
        if (item.comment && item.comment.length > 0) {
          self.__TextWriter.writeIndent(indent + 2)
          self.__TextWriter.writeLine('/**')
          var commentList = self.splitComment(item.comment)
          commentList.forEach(function (c) {
            self.__TextWriter.writeIndent(indent + 3)
            self.__TextWriter.writeLine('* ' + c)
          })
          self.__TextWriter.writeIndent(indent + 3)
          self.__TextWriter.writeLine('*/')
        }
        var arr = item.name.split(/[- ]/g)
        var na = arr.join('_')
        self.__TextWriter.writeIndent(indent + 2)
        if (illegal) {
          self.__TextWriter.writeLine(na + '="' + item.name + '",')
        } else {
          self.__TextWriter.writeLine(na + '=' + item.value + ',')
        }
      })
    }
    self.__TextWriter.writeIndent(indent)
    self.__TextWriter.writeLine('}')
  }

  function getType(type) {
    const ignoredTypes =
      self.generateOptions && self.generateOptions.ignoredTypes
    if (ignoredTypes && ignoredTypes.includes(type)) {
      return 'unknown'
    }
    switch (type.toLocaleLowerCase()) {
      case 'string':
        return 'string'
      case 'boolean':
        return 'boolean'
      case 'float':
      case 'double':
      case 'decimal':
      case 'long':
      case 'integer':
      case 'int':
      case 'short':
      case 'byte':
        return 'number'
      case 'duration':
      case 'datetime':
      case 'time':
      case 'date':
        if (self.specialDate) {
          return 'string'
        }
        return 'Date'
      case 'binary':
        return 'number[]'
      default:
        if (self.needSpecialFormat) {
          return self.prefix + type
        }
        return type
    }
  }

  function getDefaultValue(type) {
    switch (type) {
      case 'string':
        return '""'
      case 'number':
        return '0'
      default:
        return 'null'
    }
  }

  self.prefix = 'I'

  function formatInterfaceName(name) {
    if (self.needSpecialFormat) {
      return self.prefix + name
    }
    return name
  }

  function camelCase(name) {
    var initialLetter = name[0]
    if (self.needCameCase) {
      initialLetter = initialLetter.toLowerCase()
    } else {
      initialLetter = initialLetter.toUpperCase()
    }
    return initialLetter + name.slice(1)
  }
}

TSWriter.prototype = new BaseWriter()

export class WriterFactory {
  static create(lang: string) {
    switch (lang) {
      case 'ts':
        return new TSWriter()
      default:
        return null
    }
  }
}
