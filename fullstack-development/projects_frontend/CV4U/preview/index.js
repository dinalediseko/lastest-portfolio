function loadImg(event, targetId) {
    const reader = new FileReader();
    reader.onload = () => document.getElementById(targetId).src = reader.result;
    reader.readAsDataURL(event.target.files[0]);
}

function updatePreview() {
    document.getElementById('dispName').innerText = document.getElementById('inName').value.toUpperCase();
    document.getElementById('dispID').innerText = "ID " + document.getElementById('inID').value;
    document.getElementById('dispOrg').innerText = document.getElementById('inOrg').value.toUpperCase();
    document.getElementById('dispModule').innerText = document.getElementById('inModule').value.toUpperCase();
}

async function generateBulk() {
    const csv = document.getElementById('csvFile').files[0];
    if (!csv) return alert("Please upload a CSV file first!");

    const reader = new FileReader();
    reader.onload = async (e) => {
        const lines = e.target.result.split('\n').filter(l => l.trim());
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('l', 'px', [1123, 794]);
        const element = document.getElementById('cert-container');
        const orgName = document.getElementById('inOrg').value;
        const moduleName = document.getElementById('inModule').value;

        // Preserve current preview configuration
        const originalName = document.getElementById('dispName').innerText;
        const originalID = document.getElementById('dispID').innerText;
        const originalOrg = document.getElementById('dispOrg').innerText;
        const originalModule = document.getElementById('dispModule').innerText;

        for (let i = 0; i < lines.length; i++) {
            const row = lines[i].split(',');
            if (row.length < 2) continue;

            const name = row[0].trim();
            const id = row[1].trim();

            // Skip potential table headers inside the CSV dynamically
            if (name.toUpperCase() === "NAME" || name.toUpperCase() === "STUDENT NAME") continue;

            document.getElementById('dispName').innerText = name.toUpperCase();
            document.getElementById('dispID').innerText = "ID " + id;
            document.getElementById('dispOrg').innerText = orgName.toUpperCase();
            document.getElementById('dispModule').innerText = moduleName.toUpperCase();

            // Give DOM time to update rendering visually before grabbing the canvas screenshot
            await new Promise(r => setTimeout(r, 150));
            const canvas = await html2canvas(element, { scale: 2, useCORS: true });
            if (i > 0) pdf.addPage();
            pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 1123, 794);
        }

        // Restore preview elements back to original states
        document.getElementById('dispName').innerText = originalName;
        document.getElementById('dispID').innerText = originalID;
        document.getElementById('dispOrg').innerText = originalOrg;
        document.getElementById('dispModule').innerText = originalModule;

        pdf.save('Certified_Certificates.pdf');
    };
    reader.readAsText(csv);
}