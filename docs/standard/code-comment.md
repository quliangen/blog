# 代码注释规范

代码是给人看的，附带能在机器上运行。

## 注释目的

1. 提高代码的可读性和可维护性
2. 提高代码编写效率和准确性，从而最终提高代码质量。
3. 快速导出接口文档

如何写好注释呢？

## 注释原则

一个原则「**As short as possible, As long as necessary**」。

- 如无必要，勿增注释 ( As short as possible )
- 如有必要，尽量详尽 ( As long as necessary )

「**如无必要，勿增注释**」是指注释能不写就不写，不要为了注释而注释。多余的注释等价于冗余的代码，除了不能增加可读性，一旦代码需要修改，修改注释也会是一大负担。

我们应当追求「**代码自注释**」，即代码本身就拥有较高的可读性（通过清晰的命名、合理的结构等）。举个例子：

```js
// bad
// 如果已经准备好数据，就渲染表格
if (data.success && data.result.length > 0) {
  renderTable(data)
}

// good
if (data.success && data.result.length > 0) renderTable(data);

// good
const isTableDataReady = data.success && data.result.length > 0;

isTableDataReady && renderTable(data)
```

「**如有必要，尽量详尽**」是指需要注释的地方应该尽量详尽地去写，让阅读者可以更好的了解代码的逻辑和意图。

## 注释规约

### 使用 `//` 作为单行注释

注释尽可能写在被注释对象的上方，不要追加在某条语句的后面。

注释行的上方需要有一个空行（除非注释行上方是一个块的顶部），以增加可读性。

注释内容和注释符之间需要有一个空格，以增加可读性。

```js
// bad
const active = true // is current tag

// bad
//is current tag
const active = true

// good
// is current tag
const active = true

// bad
function getType() {
  console.log('fetching type...')
  // set the default type to 'no type'
  const type = this._type || 'no type'

  return type
}

// good
function getType() {
  console.log('fetching type...')

  // set the default type to 'no type'
  const type = this._type || 'no type'

  return type
}

// bad
data() {
  return {
    isPageLoading: true,//页面loading
    isPageNetError: false,// 网络错误
    isPageNoSupport: false, //兜底页
  }
}

// good
data() {
  return {
    isPageLoading: true, // 页面loading
    isPageNetError: false, // 网络错误
    isPageNoSupport: false, // 兜底页
  }
}
```

### 使用 `/** ... */` 作为多行注释

注释包含描述、指定所有参数和返回值的类型和值。

```js
// bad
// make() 返回一个新元素
// 根据传入的 tag 名称
function make(tag) {
  // ...

  return element
}

// good
/**
 * make() 返回一个新元素
 * 根据传入的 tag 名称
 * 
 * @param {string} tag
 * @return {element} element
 */
function make(tag) {
  // ...

  return element
}
```

## 使用 Comment Tag

给注释增加 `FIXME`，`TODO` 等 Tag 前缀可以帮助其它开发者快速了解这是一个需要注意的问题。

常用的特殊标记如下：

- **BUG** - 应该修复的bug
- **FIXME** - 应该更正
- **HACK** - 解决方法
- **TODO** - 需要做的事
- **UNDONE** - 撤销或回滚之前的代码
- **XXX** - 警告其他程序员有问题或错误引导的代码

```js
// FIXME
function errorCode() {
  // ...
}
```

### 档类注释，如函数、类、文件、事件等，使用 JSDoc 规范

[JSDoc 规范](https://en.wikipedia.org/wiki/JSDoc)

```js
/**
 * 接口 - 获取榜单页面数据
 * 
 * 请求数据接口param参数
 * @param {string} rankType 榜单类型
 * @param {number} rankDataId 榜单ID
 */
async getBrandRankInfo() {
  //...
}
```

## 工具

- TODO Highlight 

安装 VScode 插件，可将 Comment Tag 高亮展示。
```js
// TODO: 做些什么
// FIXME: 修复我
...
```
![](./images/code_comment_hightlight.jpg)

- Better Comments：更人性化的注释
Better Comments 是一款开发插件，可以帮助开发者在代码中创建更人性化的注释。
