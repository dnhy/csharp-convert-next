const a = (res) => {
  // HTML 转义函数
  const escapeHtml = (text) => {
    if (text == null) return "";
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  };

  // 处理数据：直接处理 bins 数组
  const processData = (data) => {
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    return data.map((bin) => {
      return {
        code: escapeHtml(bin.whseBin_BinNum || ""),
        warehouseCode: escapeHtml(bin.whseBin_WarehouseCode || ""),
        partNum: escapeHtml(bin.partNum || ""),
        onhandQty: bin.onhandQty ? parseFloat(bin.onhandQty) : null,
        ium: escapeHtml(bin.ium || ""),
      };
    });
  };

  const bins = processData(res);

  if (bins.length === 0) {
    return `
      <div style="
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 80px 0;
        font-size: 28px;
        color: #8a8a8a;
        height: 100%;
      ">
        No data available.
      </div>
    `;
  }

  // 使用固定的 scrollContainerId
  const scrollContainerId = "warehouse-scroll-container";
  const scrollPositionKey = "warehouse-scroll-position";

  // 生成卡片
  const generateCard = (item) => {
    const hasStock = item.partNum && item.onhandQty;

    return `
      <div style="
        background-color: ${hasStock ? "#E8EDF7" : "#f8f9fa"};
        border-radius: 16px;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        padding: 32px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 200px;
        gap: 16px;
      ">
        <div style="
          font-size: 32px;
          font-weight: 600;
          color: #2d2d2d;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        ">
          ${item.code}
        </div>
        ${
          item.warehouseCode
            ? `
          <div style="
            font-size: 20px;
            color: #6a6a6a;
            margin-top: 4px;
            text-align: center;
            font-weight: 400;
          ">
            ${item.warehouseCode}
          </div>
        `
            : ""
        }
        ${
          item.partNum
            ? `
          <div style="
            font-size: 24px;
            color: #4a4a4a;
            margin-top: 8px;
            text-align: center;
            word-break: break-all;
            font-weight: 500;
          ">
            ${item.partNum}
          </div>
        `
            : ""
        }
        ${
          item.onhandQty
            ? `
          <div style="
            font-size: 36px;
            font-weight: 600;
            color: #2d2d2d;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          ">
            ${item.onhandQty.toLocaleString()} ${item.ium}
          </div>
        `
            : `
          <div style="
            font-size: 28px;
            color: #8a8a8a;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          ">
            Vacant
          </div>
        `
        }
      </div>
    `;
  };

  return `
    <div style="
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      padding: 24px;
    ">
      <!-- 统一的 Card 容器 -->
      <div style="
        display: flex;
        flex-direction: column;
        height: 100%;
        padding: 48px;
        background-color: #ffffff;
        border-radius: 16px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
        overflow: hidden;
      ">
        <!-- 固定顶部区域：标题 -->
        <div style="
          flex-shrink: 0;
          margin-bottom: 32px;
        ">
          <!-- 标题栏 -->
          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">
            <h2 style="
              font-size: 48px;
              font-weight: 700;
              color: #2d2d2d;
              margin: 0;
            ">
              Warehouse location map
            </h2>
            <div style="
              width: 64px;
              height: 64px;
              background-color: #556ea7;
              border-radius: 12px;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24"><path fill="currentColor" d="m15 19.923l-6-2.1l-5 1.94V5.782l5-1.704l6 2.1l5-1.94v14.04zm-.5-1.22v-11.7l-5-1.745v11.7zm1 0L19 17.55V5.7l-3.5 1.304zM5 18.3l3.5-1.342v-11.7L5 6.45zM15.5 7.004v11.7zm-7-1.746v11.7z"/></svg>
            </div>
          </div>
        </div>
        
        <!-- 可滚动内容区域 -->
        <div id="${scrollContainerId}" 
          onmouseenter="(function(){
            const container = document.getElementById('${scrollContainerId}');
            if(container && container._scrollInterval) {
              clearInterval(container._scrollInterval);
              container._scrollInterval = null;
              container._isPaused = true;
            }
          })()"
          onmouseleave="(function(){
            const container = document.getElementById('${scrollContainerId}');
            if(container && container._isPaused) {
              container._isPaused = false;
              if(!container._scrollInterval) {
                container._scrollInterval = setInterval(function(){
                  if(!container || container._isPaused) return;
                  const maxScroll = container.scrollHeight - container.clientHeight;
                  if(maxScroll <= 0) return;
                  if(container.scrollTop >= maxScroll - 1) {
                    container.scrollTop = 0;
                    return;
                  } else {
                    container.scrollTop += 5;
                  }
                  // 保存滚动位置
                  try {
                    sessionStorage.setItem('${scrollPositionKey}', container.scrollTop.toString());
                  } catch(e) {}
                }, 20);
              }
            }
          })()"
          onscroll="(function(){
            const container = document.getElementById('${scrollContainerId}');
            if(container) {
              // 保存滚动位置
              try {
                sessionStorage.setItem('${scrollPositionKey}', container.scrollTop.toString());
              } catch(e) {}
            }
          })()"
          style="
            flex: 1;
            overflow-y: auto;
            overflow-x: hidden;
            min-height: 0;
            scroll-behavior: auto;
          "
        >
          <div style="
            display: grid;
            grid-template-columns: repeat(6, 1fr);
            gap: 32px;
          ">
            ${bins.map((item) => generateCard(item)).join("")}
          </div>
        </div>
        
        <!-- 隐藏元素用于启动自动滚动和恢复位置 -->
        <img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" 
          style="display:none;width:0;height:0;"
          onload="(function(){
            setTimeout(function(){
              const scrollContainer = document.getElementById('${scrollContainerId}');
              if(!scrollContainer) return;
              
              // 恢复之前的滚动位置
              try {
                const savedPosition = sessionStorage.getItem('${scrollPositionKey}');
                if(savedPosition !== null) {
                  const position = parseFloat(savedPosition);
                  if(position >= 0) {
                    scrollContainer.scrollTop = position;
                  }
                }
              } catch(e) {}
              
              // 启动自动滚动
              if(!scrollContainer._scrollInterval && !scrollContainer._isPaused) {
                scrollContainer._isPaused = false;
                scrollContainer._scrollInterval = setInterval(function(){
                  if(!scrollContainer || scrollContainer._isPaused) return;
                  const maxScroll = scrollContainer.scrollHeight - scrollContainer.clientHeight;
                  if(maxScroll <= 0) return;
                  if(scrollContainer.scrollTop >= maxScroll - 5) {
                    scrollContainer.scrollTop = 0;
                    try {
                      sessionStorage.setItem('${scrollPositionKey}', '0');
                    } catch(e) {}
                    return;
                  } else {
                    scrollContainer.scrollTop += 5;
                    // 保存滚动位置
                    try {
                      sessionStorage.setItem('${scrollPositionKey}', scrollContainer.scrollTop.toString());
                    } catch(e) {}
                  }
                }, 20);
              }
            }, 500);
          })()"
        />
      </div>
    </div>
  `;
};
