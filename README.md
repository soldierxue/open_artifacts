# Open Artifacts

## 关于Artifacts
Artifacts是Anthropic推出的一项新功能，它扩展了用户与Claude模型的互动方式。
当用户要求Claude生成代码片段、文本文档或网站设计等内容时，这些工件会出现在他们对话的专用窗口中。
可以实时查看、编辑和构建Claude的创作，将claude生成的内容无缝集成到他们的项目和工作流程中

## 本开源Artifacts项目简介
- 本项目采用 [Vercel AI](https://sdk.vercel.ai/) 是一个next.js开源的大模型应用开发框架，并借鉴了[e2b](https://e2b.dev/docs) 中的example，它通过code intereptor组件与Claude模型交互，生成相应的代码，文本及设计内容，然后通过e2b的云端sandbox执行并返回交互式的结果。
- 目前主要功能特点如下：
1. 支持Bedrock Claude 3.5接入
2. 直接使用本地自己制作的docker image作为sandbox，保证数据隐私和安全，提高开发便捷性，执行性能。
3. 新增支持HTML/JS 前端渲染功能，可以生成HTML/JS代码，直接在浏览器渲染，并可以支持实时交互。
4. 新增图片上传加入多模态能力，例如可以上传excel表格，pdf截图，并生成代码做数据可视化分析。
5. 其他小功能，例如清除上下文，复制粘贴直接上传图片等

## 使用说明
### 1. 配置docker image
1. 进入open_artifacts/docker_files
```bash
cd open_artifacts/docker_files
```
2. 安装 &启动 docker(如有可调过)
```bash
sudo yum install docker -y
sudo service docker start
sudo chmod 666 /var/run/docker.sock
```
3. 在本文件夹下（包含 Dockerfile） 的目录中打开终端，运行以下命令来构建 Docker 镜像：
```bash
docker build -t python3.10 .
```
这个命令会创建一个名为 python3.10 的 Docker 镜像。如果需要安装某个特定的 Python 版本，或者需要安装其他依赖，则可以在Dockerfile 中进行修改。

### 2. 配置.env, 设置AK SK，并开通权限
1. 在open_artifacts目录下创建一个：.env文件，内容如下
```
AWS_ACCESS_KEY_ID=*******
AWS_SECRET_ACCESS_KEY=******
AWS_REGION=us-east-1
PYTHON_DOCKER_IMAGE=python3.10
MODULE_ID=anthropic.claude-3-5-sonnet-20240620-v1:0
```

2. 如果在本地启用执行，执行成功会打开本地3000的ui端口. 通过http://localhost:3000访问
```bash
yarn
yarn dev
```
- 如果在云端主机使用，需要打开3000端口,通过http://ip:3000访问
```bash
yarn dev -- -H 0.0.0.0
```

## 效果演示
1. 贪吃蛇
```
1. 创建一个自动的贪吃蛇游戏, be cool and fancy
2. 更换背景颜色为黑色
3. 放一些烟花背景等
4. 增加星空背景图
```
![alt text](asset/image.png)

2. 模拟太阳系
```
make a threejs app of a space sim with gravity of a solar system with planets in a single web file.
the planets should be orbiting around the sun. Add a light source to the sun and realistic random materials to each planet. Add orbit traces to all bodies. use cannonjs. Using top view.
```
![alt text](asset/image2.png)

3. 数据可视化分析
```
把图片中latency与concurrency的关系绘制出来，可视化展示
```
![alt text](asset/image3.png)
```
你是一名专业的数据分析师，第1张图是ml.p4d.24xlarge，在tp=8的性能测试数据，第2张图是ml.p4de.24xlarge，在tp=4的性能测试数据，第3张图是ml.p4de.24xlarge，在tp=8的性能测试数据。请对比分析这3张图中的数据，并绘制可视化的数据分析对比图，重点关注concurrency 跟 throughput，latency的关系
```
![alt text](asset/image4.png)

4. 生成架构图
```
create an web server architecture diagram using aws loadbalancer, ec2, rds
```
```
add api gateway between lb and web servers, and put the servers in vpc
```
```
it errors : No module named 'diagrams.aws.apigateway'\n
```
![alt text](asset/image5.png)
```
explain the architecture in the image, and alternate all the services to aws services accordingly and draw aws architecture diagram
```
![alt text](asset/image6.png)
## 其他
### 其他功能正在设计中