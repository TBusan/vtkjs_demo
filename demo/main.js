import '@kitware/vtk.js/Rendering/Profiles/All';
import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';
import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import vtkImageData from '@kitware/vtk.js/Common/DataModel/ImageData';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import vtkImageMarchingSquares from '@kitware/vtk.js/Filters/General/ImageMarchingSquares';
import vtkLookupTable from '@kitware/vtk.js/Common/Core/LookupTable';

function renderContour(config) {
    if (!config.z || !Array.isArray(config.z) || !Array.isArray(config.z[0])) {
        throw new Error('Invalid input data format');
    }

    // 创建渲染窗口
    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
        container: document.querySelector('#vtk-container'),
        background: [1, 1, 1]  // 白色背景
    });

    const renderer = fullScreenRenderer.getRenderer();
    const renderWindow = fullScreenRenderer.getRenderWindow();

    function createFieldData(zData) {
        const rows = zData.length;
        const cols = zData[0].length;
        const imageData = vtkImageData.newInstance();
        
        // 设置网格大小以匹配数据
        const dimensions = [cols, rows, 1];
        const spacing = [1, 1, 1];
        const origin = [0, 0, 0];
        
        imageData.setDimensions(dimensions);
        imageData.setSpacing(spacing);
        imageData.setOrigin(origin);
        
        // 创建数据数组
        const values = new Float32Array(rows * cols);
        let index = 0;
        
        // 反转Y轴方向以匹配Plotly的方向
        for (let y = rows - 1; y >= 0; y--) {
            for (let x = 0; x < cols; x++) {
                values[index++] = zData[y][x];
            }
        }
        
        const dataArray = vtkDataArray.newInstance({
            name: 'scalars',
            values: values,
            numberOfComponents: 1
        });
        
        imageData.getPointData().setScalars(dataArray);
        return imageData;
    }

    function createVisualization(zData) {
        const fieldData = createFieldData(zData);
        
        // 计算数据范围
        const values = fieldData.getPointData().getScalars().getData();
        const minValue = Math.min(...values);
        const maxValue = Math.max(...values);
        
        // 创建等值线提取器
        const marchingSquares = vtkImageMarchingSquares.newInstance();
        marchingSquares.setInputData(fieldData);
        
        // 计算等值线值（使用更均匀的分布）
        const numberOfContours = 10;
        const step = (maxValue - minValue) / (numberOfContours + 1);
        const contourValues = [];
        
        for (let i = 1; i <= numberOfContours; i++) {
            contourValues.push(minValue + step * i);
        }
        marchingSquares.setContourValues(contourValues);
        
        // 创建映射器
        const mapper = vtkMapper.newInstance();
        mapper.setInputConnection(marchingSquares.getOutputPort());
        mapper.setScalarRange(minValue, maxValue);
        
        // 创建actor
        const actor = vtkActor.newInstance();
        actor.setMapper(mapper);
        
        // 设置线条样式
        const property = actor.getProperty();
        property.setLineWidth(2);
        property.setColor(0.4, 0.4, 0.4);  // 灰色线条
        property.setOpacity(1.0);
        
        return {
            actor,
            bounds: fieldData.getBounds(),
            dimensions: fieldData.getDimensions()
        };
    }

    // 创建场景
    const { actor, bounds, dimensions } = createVisualization(config.z);
    renderer.addActor(actor);

    // 设置相机以匹配Plotly的视图
    renderer.resetCamera();
    const camera = renderer.getActiveCamera();
    camera.setParallelProjection(true);
    
    // 计算合适的视图范围
    const width = bounds[1] - bounds[0];
    const height = bounds[3] - bounds[2];
    const padding = Math.max(width, height) * 0.1;  // 添加10%的边距
    
    // 设置相机位置和视图
    camera.setPosition(width / 2, height / 2, 100);
    camera.setFocalPoint(width / 2, height / 2, 0);
    camera.setViewUp(0, 1, 0);
    
    // 调整相机缩放以适应数据
    const parallelScale = Math.max(width, height) * 0.6;
    camera.setParallelScale(parallelScale);

    // 渲染
    renderWindow.render();

    // 响应窗口大小变化
    window.addEventListener('resize', () => {
        fullScreenRenderer.resize();
    });

    return {
        renderer,
        renderWindow,
        actor
    };
}

// 测试数据
const config = {
    z: [
        [2, 4, 7, 12, 13, 14, 15, 16],
        [3, 1, 6, 11, 12, 13, 16, 17],
        [4, 2, 7, 7, 11, 14, 17, 18],
        [5, 3, 8, 8, 13, 15, 18, 19],
        [7, 4, 10, 9, 16, 18, 20, 19],
        [9, 10, 5, 27, 23, 21, 21, 21],
        [11, 14, 17, 26, 25, 24, 23, 22]
    ],
    type: 'contour',
    line: {
        smoothing: 0
    },
    contours: {
        coloring: 'lines'
    },
    xaxis: 'x1',
    yaxis: 'y1'
};

renderContour(config); 