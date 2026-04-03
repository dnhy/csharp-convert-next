const a = (res) => {
  //   const locationDatas = [
  //     {
  //       warehouseName: "A01 Location",
  //       utilzation: 85,
  //       maxSKU: 42,
  //       pns: 1250,
  //     },
  //     {
  //       warehouseName: "A02 Location",
  //       utilzation: 39,
  //       maxSKU: 23,
  //       pns: 5432,
  //     },
  //     {
  //       warehouseName: "A03 Location",
  //       utilzation: 35,
  //       maxSKU: 22,
  //       pns: 30,
  //     },
  //     {
  //       warehouseName: "A04 Location",
  //       utilzation: 23,
  //       maxSKU: 322,
  //       pns: 23,
  //     },
  //   ];

  const locationDatas = res.map((item) => {
    return {
      ...item,
      utilzation: (item.utilzation * 100).toFixed(1),
    };
  });

  const key = "loopCurrIdx";

  const currIdx = +(sessionStorage.getItem(key) ?? 0);

  if (!locationDatas || locationDatas.length === 0) {
    return;
  }

  let locationData = locationDatas[currIdx];

  let idx = currIdx;

  if (window.detailTimer) {
    clearInterval(window.detailTimer);
    window.detailTimer = null;
  }

  window.detailTimer = setInterval(() => {
    idx = (idx + 1) % locationDatas.length;
    locationData = locationDatas[idx];

    const unit0 = document.getElementById("unit0");
    const unit1 = document.getElementById("unit1");
    const unit11 = document.getElementById("unit1-1");
    const unit2 = document.getElementById("unit2");
    const unit3 = document.getElementById("unit3");
    if (unit0) {
      unit0.innerHTML = locationData.warehouseName;
    }
    if (unit1) {
      unit1.innerHTML = locationData.utilzation + "%";
    }
    if (unit11) {
      unit11.style.width = locationData.utilzation + "%";
    }
    if (unit2) {
      unit2.innerHTML = locationData.pns + "";
    }
    if (unit3) {
      unit3.innerHTML = locationData.maxSKU + "";
    }
    sessionStorage.setItem(key, idx + "");
    console.log("idx :", idx);
  }, 10000);

  return `
      <div style="
        background-color: #ffffff;
        border-radius: 24px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
        padding: 48px;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        max-width: 1600px;
        width: 100%;
        height:100%;
      ">
        <!-- Header -->
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 48px;
        ">
          <h2 style="
            font-size: 40px;
            font-weight: 700;
            color: #2d2d2d;
            margin: 0;
          ">
            Location Details
          </h2>
          <div style="
            width: 64px;
            height: 64px;
            background-color: #10B981;
            border-radius: 16px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9" stroke="white" stroke-width="2" fill="none"/>
              <path d="M12 8V12M12 16H12.01" stroke="white" stroke-width="2" stroke-linecap="round"/>
            </svg>
          </div>
        </div>
        
        <!-- Location Identifier -->
        <div style="
          display: flex;
          align-items: center;
          gap: 32px;
          margin-bottom: 48px;
        ">
      
          <div>
            <div id="unit0"
            style="
              font-size: 88px;
              font-weight: 700;
              color: #2d2d2d;
              margin-bottom: 8px;
            ">
              ${locationData.warehouseName}
            </div>
          
          </div>
        </div>
        
        <!-- Statistics Cards -->
        <div style="
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 32px;
          margin-bottom: 48px;
        ">
          <!-- Utilization Rate Card -->
          <div style="
            background-color: #f8f9fa;
            border-radius: 16px;
            padding: 70px;
          ">
            <div id="unit1" style="
              font-size: 100px;
              font-weight: 800;
              color: #2d2d2d;
              margin-bottom: 16px;
              text-align: center;
            ">
              ${locationData.utilzation}%
            </div>
            <div style="
              font-size: 36px;
              color: #4a4a4a;
              margin-bottom: 24px;
              text-align: center;
            ">
              Utilization
            </div>
            <div style="
              width: 100%;
              height: 16px;
              background-color: #E5E7EB;
              border-radius: 8px;
              overflow: hidden;
            ">
              <div id="unit1-1" style="
                width: ${locationData.utilzation}%;
                height: 100%;
                background-color: #3B82F6;
                border-radius: 8px;
                transition: width 0.3s ease;
              "></div>
            </div>
          </div>
          
          <!-- Product Categories Card -->
          <div style="
            background-color: #f8f9fa;
            border-radius: 16px;
            padding: 70px;
          ">
            <div id="unit2" style="
              font-size: 80px;
              font-weight: 700;
              color: #2d2d2d;
              margin-bottom: 16px;
              text-align: center;
            ">
              ${locationData.pns}
            </div>
            <div style="
              font-size: 36px;
              color: #4a4a4a;
              text-align: center;
            ">
              No of PNs
            </div>
          </div>
          
          <!-- Total Products Card -->
          <div style="
            background-color: #f8f9fa;
            border-radius: 16px;
            padding: 70px;
          ">
            <div id="unit3" style="
              font-size: 80px;
              font-weight: 700;
              color: #2d2d2d;
              margin-bottom: 16px;
              text-align: center;
            ">
              ${locationData.maxSKU}
            </div>
            <div style="
              font-size: 36px;
              color: #4a4a4a;
              text-align: center;
            ">
              MAX SKU
            </div>
          </div>
        </div> 
      </div>
    `;
};
