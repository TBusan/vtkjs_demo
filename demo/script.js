// 初始化 VTK 渲染器
let renderer, renderWindow, openglRenderWindow, interactor;

// 创建示例数据
function createSampleData() {
    const vtkImageData = vtk.Common.DataModel.vtkImageData.newInstance();
    const dims = [50, 50, 1];  // 2D数据
    const spacing = [1, 1, 1];
    
    vtkImageData.setDimensions(dims);
    vtkImageData.setSpacing(spacing);
    
    // 创建标量数据
    const scalars = new Float32Array(dims[0] * dims[1] * dims[2]);
    let index = 0;
    
    for (let j = 0; j < dims[1]; j++) {
        for (let i = 0; i < dims[0]; i++) {
            const x = i - dims[0] / 2;
            const y = j - dims[1] / 2;
            // 创建一个简单的二次函数作为示例数据
            scalars[index++] = (x * x + y * y) / 50;
        }
    }
    
    const dataArray = vtk.Common.Core.vtkDataArray.newInstance({
        name: 'scalars',
        values: scalars,
    });
    
    vtkImageData.getPointData().setScalars(dataArray);
    return vtkImageData;
}

// 创建等值线
function createContours(imageData, isoValue) {
    const contourFilter = vtk.Filters.General.vtkContourFilter.newInstance();
    contourFilter.setInputData(imageData);
    contourFilter.setComputeNormals(true);
    contourFilter.setComputeScalars(true);
    contourFilter.setContourValue(0, isoValue);
    
    const mapper = vtk.Rendering.Core.vtkMapper.newInstance();
    mapper.setInputConnection(contourFilter.getOutputPort());
    
    const actor = vtk.Rendering.Core.vtkActor.newInstance();
    actor.setMapper(mapper);
    
    return actor;
}

// 初始化场景
function initScene() {
    // 创建渲染器
    renderer = vtk.Rendering.Core.vtkRenderer.newInstance();
    renderWindow = vtk.Rendering.Core.vtkRenderWindow.newInstance();
    openglRenderWindow = vtk.Rendering.OpenGL.vtkRenderWindow.newInstance();
    interactor = vtk.Rendering.Core.vtkRenderWindowInteractor.newInstance();
    
    renderWindow.addRenderer(renderer);
    renderWindow.addView(openglRenderWindow);
    interactor.setView(openglRenderWindow);
    interactor.initialize();
    
    // 设置背景色
    renderer.setBackground(1.0, 1.0, 1.0);
    
    // 创建示例数据
    const imageData = createSampleData();
    
    // 创建初始等值线
    const actor = createContours(imageData, 50);
    renderer.addActor(actor);
    
    // 调整相机位置
    renderer.resetCamera();
    renderWindow.render();
    
    // 添加滑块事件监听
    const isoValueSlider = document.getElementById('isoValue');
    const isoValueDisplay = document.getElementById('isoValueDisplay');
    
    isoValueSlider.addEventListener('input', (event) => {
        const value = parseFloat(event.target.value);
        isoValueDisplay.textContent = value;
        
        // 更新等值线
        renderer.removeAllViewProps();
        const newActor = createContours(imageData, value);
        renderer.addActor(newActor);
        renderWindow.render();
    });
}

// 初始化应用
window.onload = function() {
    const container = document.getElementById('viewer');
    openglRenderWindow.setContainer(container);
    
    // 设置渲染窗口大小
    const { width, height } = container.getBoundingClientRect();
    openglRenderWindow.setSize(width, height);
    
    initScene();
    
    // 添加窗口大小改变事件监听
    window.addEventListener('resize', () => {
        const { width, height } = container.getBoundingClientRect();
        openglRenderWindow.setSize(width, height);
        renderWindow.render();
    });
}; 