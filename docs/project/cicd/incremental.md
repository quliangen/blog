# 前端增量部署

## 方案一：使用 rsync 配置指南

```bash
cd /data/opt/nginx/html
tar xf dist.tar.gz
rsync -avr dist/PROJECT_NAME/
\rm -rf dist dist.tar.gz
```


## 示例

历史

```bash
cd /data/opt/nginx/html
tar xf dist.tar.gz
\rm -rf  ./blog
mkdir ./blog
mv ./dist/* ./blog
\rm -rf ./dist.tar.gz
```

修改后

```bash
cd /data/opt/nginx/html
tar xf dist.tar.gz
rsync -avr dist/blog/
\rm -rf dist dist.tar.gz
```
