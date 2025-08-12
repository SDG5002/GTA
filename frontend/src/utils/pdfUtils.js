import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export const handleDownloadPDF = async (elementRef, filename="exam-analysis") => {
    
    const element = elementRef.current
    if(!element) return;
    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "px",
      format: "a4", 
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;
    const ratio = pdfWidth / imgWidth;
    const scaledHeight = imgHeight * ratio;

    let position = 0;

    while (position < scaledHeight) {
      pdf.addImage(imgData, "PNG", 0, -position, pdfWidth, scaledHeight);
      position += pdfHeight;

      if (position < scaledHeight) {
        pdf.addPage();
      }
    }

    pdf.save(filename + ".pdf");
  };



 