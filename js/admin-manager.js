import "./manager.js";

document.addEventListener("eventmap:save-layout", async (event) => {
  const message = document.querySelector("#manager-message");
  try {
    const response = await fetch("./api/admin/save-map.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event.detail),
    });
    const data = await response.json();
    if (!response.ok || !data.ok) throw new Error(data.error || "Save failed");
    message.textContent = "บันทึกลง Google Sheet แล้ว";
  } catch (error) {
    message.textContent = `บันทึกไม่สำเร็จ: ${error.message}`;
  }
});
