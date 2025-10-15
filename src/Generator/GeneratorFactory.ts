import { WriterFactory } from "./WriterFactory";

class GeneratorFactory {
  static annotation = true;
  static cache = {};
  static WriterFactory: any;
  static generate(param, options, generateOptions) {
    var service_info = param.service_info;
    // var cache = GeneratorFactory.cache[service_info.code];
    options = options || {};
    // var needOverwrite = options.overwrite;
    delete options.overwrite;

    var root = param.root;
    if (!root || !root.children) {return "";}
    // 生成写入实例
    var writer = GeneratorFactory.WriterFactory.create(param.lang);
    if (!writer) {return "";}
    for (var key in options) {
      writer[key] = options[key];
    }
    if (generateOptions) {
      writer.generateOptions = generateOptions;
    }
    var req = null,
      resp = null;
    root.children.forEach(function (item) {
      var model = item.model;
      if (service_info.requestModelId > 0 && model && model.id === service_info.requestModelId) {req = item;}
      if (service_info.responseModelId > 0 && model && model.id === service_info.responseModelId) {resp = item;}
    });
    try {
      if (writer.preWrite) {writer.preWrite(service_info);}
      writer.writeRequest(req);
      writer.writeResponse(resp, param);
      if (writer.writeCacheType) {writer.writeCacheType();}
      if (writer.endWrite) {writer.endWrite(service_info, req, resp);}
      var content = writer.toString();
      // if (content && content.length > 0) cache[param.version][param.lang] = content;
    } catch (error) {
      content = error;
      console.log(error);
    }
    writer.clear();

    return content;
  }
  // static generateList(param, options) {
  //   var service_info = param.service_info;
  //   // var cache = GeneratorFactory.cache[service_info.code];
  //   var root = param.root || cache[param.version]["data"];
  //   var writer = GeneratorFactory.WriterFactory.create(param.lang);
  //   return writer.generate(service_info, root);
  // }
  // static hasValue(param) {
  //   var service_info = param.service_info;
  //   var cache = GeneratorFactory.cache[service_info.code];
  //   if (!cache || !cache[param.version] || !cache[param.version]["data"]) return false;
  //   return true;
  // }
}

GeneratorFactory.WriterFactory = WriterFactory;
export { GeneratorFactory };
