/// <reference path="./editor.ts" />
/// <reference path="./utils.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var AnalyzerMapperElement = (function () {
    function AnalyzerMapperElement(name, type, offset, bitoffset, bitcount, value) {
        if (offset === void 0) { offset = 0; }
        if (bitoffset === void 0) { bitoffset = 0; }
        if (bitcount === void 0) { bitcount = 0; }
        if (value === void 0) { value = null; }
        this.name = name;
        this.type = type;
        this.offset = offset;
        this.bitoffset = bitoffset;
        this.bitcount = bitcount;
        this.value = value;
    }
    return AnalyzerMapperElement;
})();
var AnalyzerMapperNode = (function (_super) {
    __extends(AnalyzerMapperNode, _super);
    function AnalyzerMapperNode(name, parent) {
        _super.call(this, name, 'struct');
        this.parent = parent;
        this.elements = [];
    }
    Object.defineProperty(AnalyzerMapperNode.prototype, "first", {
        get: function () {
            return this.elements[0];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AnalyzerMapperNode.prototype, "last", {
        get: function () {
            return this.elements[this.elements.length - 1];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AnalyzerMapperNode.prototype, "offset", {
        get: function () {
            return this.first.offset;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AnalyzerMapperNode.prototype, "bitoffset", {
        get: function () {
            return this.first.bitoffset;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AnalyzerMapperNode.prototype, "bitcount", {
        get: function () {
            return (this.last.offset - this.offset) * 8 + this.last.bitcount;
        },
        enumerable: true,
        configurable: true
    });
    return AnalyzerMapperNode;
})(AnalyzerMapperElement);
var AnalyzerMapperPlugins = (function () {
    function AnalyzerMapperPlugins() {
    }
    AnalyzerMapperPlugins.register = function (name, callback) {
        AnalyzerMapperPlugins.templates[name] = callback;
    };
    AnalyzerMapperPlugins.runAsync = function (name, editor) {
        return editor.getDataAsync().then(function (data) {
            var mapper = new AnalyzerMapper(new DataView(data.buffer));
            var e;
            try {
                AnalyzerMapperPlugins.templates[name](mapper);
            }
            catch (_e) {
                console.error(_e);
                e = _e;
            }
            return new AnalyzerMapperRendererResult(new AnalyzerMapperRenderer(editor).html(mapper.node), mapper.node, editor, mapper, e);
        });
    };
    AnalyzerMapperPlugins.templates = {};
    return AnalyzerMapperPlugins;
})();
var AnalyzerMapper = (function () {
    function AnalyzerMapper(data, node, addoffset) {
        if (node === void 0) { node = null; }
        if (addoffset === void 0) { addoffset = 0; }
        this.data = data;
        this.node = node;
        this.addoffset = addoffset;
        this.offset = 0;
        this.bitoffset = 0;
        this.little = true;
        if (this.node == null)
            this.node = new AnalyzerMapperNode("root", null);
    }
    Object.defineProperty(AnalyzerMapper.prototype, "available", {
        get: function () {
            return this.length - this.offset;
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(AnalyzerMapper.prototype, "length", {
        get: function () {
            return this.data.byteLength;
        },
        enumerable: true,
        configurable: true
    });
    AnalyzerMapper.prototype._read = function (name, type, bytecount, read) {
        var value = read(this.offset);
        this.node.elements.push(new AnalyzerMapperElement(name, type, this.addoffset + this.offset, 0, 8 * bytecount, value));
        this.offset += bytecount;
        return value;
    };
    AnalyzerMapper.prototype.u8 = function (name) {
        var _this = this;
        return this._read(name, 'u8', 1, function (offset) { return _this.data.getUint8(offset); });
    };
    AnalyzerMapper.prototype.u16 = function (name) {
        var _this = this;
        return this._read(name, 'u16', 2, function (offset) { return _this.data.getUint16(offset, _this.little); });
    };
    AnalyzerMapper.prototype.u32 = function (name) {
        var _this = this;
        return this._read(name, 'u32', 4, function (offset) { return _this.data.getUint32(offset, _this.little); });
    };
    AnalyzerMapper.prototype.str = function (name, count, encoding) {
        if (encoding === void 0) { encoding = 'ascii'; }
        var textData = new Uint8Array(count);
        for (var n = 0; n < count; n++)
            textData[n] = this.data.getUint8(this.offset + n);
        var value = new TextDecoder(encoding).decode(textData);
        this.node.elements.push(new AnalyzerMapperElement(name, 'u8[' + count + ']', this.addoffset + this.offset, 0, 8 * count, value));
        this.offset += count;
        return value;
    };
    AnalyzerMapper.prototype.subs = function (name, count) {
        var value = (this.data.buffer.slice(this.offset, this.offset + count));
        var subsnode = new AnalyzerMapperNode(name, this.node);
        var mapper = new AnalyzerMapper(new DataView(value), subsnode, this.offset);
        mapper.little = this.little;
        this.node.elements.push(subsnode);
        this.offset += count;
        return mapper;
    };
    AnalyzerMapper.prototype.struct = function (name, callback) {
        var parentnode = this.node;
        var groupnode = this.node = new AnalyzerMapperNode(name, this.node);
        var value = callback();
        groupnode.value = value;
        this.node = parentnode;
        this.node.elements.push(groupnode);
    };
    return AnalyzerMapper;
})();
var AnalyzerMapperRendererResult = (function () {
    function AnalyzerMapperRendererResult(element, node, editor, mapper, error) {
        this.element = element;
        this.node = node;
        this.editor = editor;
        this.mapper = mapper;
        this.error = error;
    }
    return AnalyzerMapperRendererResult;
})();
var AnalyzerMapperRenderer = (function () {
    function AnalyzerMapperRenderer(editor) {
        this.editor = editor;
    }
    AnalyzerMapperRenderer.prototype.html = function (element) {
        var _this = this;
        var e = $('<div class="treeelement">');
        var title = $('<div class="treetitle expanded">');
        e.append(title.text(element.type + ' ' + element.name + ' : ' + element.value));
        title.mouseover(function (e) {
            _this.editor.cursor.selection.makeSelection(element.offset, element.bitcount / 8);
        });
        if (element instanceof AnalyzerMapperNode) {
            var node = element;
            if (node.elements.length > 0) {
                title.addClass('treehaschildren');
                var childs = $('<div class="treechildren expanded">');
                node.elements.forEach(function (e) {
                    childs.append(_this.html(e));
                });
                title.click(function (e) {
                    var expanded = title.hasClass('expanded');
                    title.toggleClass('expanded', !expanded);
                    childs.toggleClass('expanded', !expanded);
                    title.toggleClass('unexpanded', expanded);
                    childs.toggleClass('unexpanded', expanded);
                });
                e.append(childs);
            }
        }
        else {
            title.click(function (e) {
                var newvalue = prompt("new value", element.value);
                if (newvalue) {
                }
            });
        }
        return e.get(0);
    };
    return AnalyzerMapperRenderer;
})();
//# sourceMappingURL=analyzer.js.map