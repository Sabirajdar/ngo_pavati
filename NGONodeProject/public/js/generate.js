document.addEventListener("DOMContentLoaded", function () {



    const form = document.getElementById("receiptForm");
    const amountInput = document.getElementById("amount");
    const amountWords = document.getElementById("amountWords");
    const saveBtn = document.getElementById("saveBtn");
    const downloadBtn = document.getElementById("downloadBtn");
    const resetBtn = document.querySelector('button[type="reset"]');
    const receiptNumberInput = document.getElementById("receipt_number");
    const message = document.getElementById("successMessage");

    if (!form) return;

    if (downloadBtn) downloadBtn.disabled = true;

    /* ---------------- Amount to Words ---------------- */

    if (amountInput) {
        amountInput.addEventListener("input", function () {
            const value = parseInt(this.value);
            amountWords.value = value && !isNaN(value) ? convertToWords(value) : "";
        });
    }

    function convertToWords(num) {

        if (num === 0) return "Zero Only";

        const ones = [
            "", "One", "Two", "Three", "Four", "Five", "Six", "Seven",
            "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen",
            "Fourteen", "Fifteen", "Sixteen", "Seventeen",
            "Eighteen", "Nineteen"
        ];

        const tens = [
            "", "", "Twenty", "Thirty", "Forty",
            "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
        ];

        function convert(n) {

            if (n < 20) return ones[n];

            if (n < 100)
                return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");

            if (n < 1000)
                return ones[Math.floor(n / 100)] + " Hundred" +
                    (n % 100 ? " " + convert(n % 100) : "");

            if (n < 100000)
                return convert(Math.floor(n / 1000)) + " Thousand" +
                    (n % 1000 ? " " + convert(n % 1000) : "");

            if (n < 10000000)
                return convert(Math.floor(n / 100000)) + " Lakh" +
                    (n % 100000 ? " " + convert(n % 100000) : "");

            return convert(Math.floor(n / 10000000)) + " Crore" +
                (n % 10000000 ? " " + convert(n % 10000000) : "");
        }

        return convert(num) + " Only";
    }

    /* ---------------- Form Validation ---------------- */

    function validateForm() {

        const financialYear = document.getElementById("financial_year").value.trim();
        const receiptDate = document.getElementById("receipt_date").value;
        const donorName = document.getElementById("donor_name").value.trim();
        const mobile = document.getElementById("mobile_number").value.trim();
        const pan = document.getElementById("pan").value.trim();
        const amountInWords = amountWords.value.trim();
        const purpose = document.getElementById("purpose_of_donation").value.trim();
        const paymentMode = document.getElementById("payment_mode").value;

        const mobilePattern = /^[0-9]{10}$/;
        const panPattern = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;

        if (!financialYear) { alert("Please enter Financial Year"); return false; }
        if (!receiptDate) { alert("Please select Receipt Date"); return false; }
        if (!donorName) { alert("Please enter Donor Name"); return false; }
        if (!mobilePattern.test(mobile)) { alert("Mobile number must be 10 digits"); return false; }
        if (pan && !panPattern.test(pan)) { alert("Invalid PAN format (ABCDE1234F)"); return false; }
        if (!amountInWords) { alert("Amount in words required"); return false; }
        if (!purpose) { alert("Please enter Purpose of Donation"); return false; }
        if (!paymentMode) { alert("Please select Payment Mode"); return false; }

        return true;
    }

    /* ---------------- Save Receipt ---------------- */

    if (saveBtn) {

        saveBtn.addEventListener("click", async function (e) {

            e.preventDefault();

            if (!validateForm()) return;

            try {

                const formData = new FormData(form);
                const payload = Object.fromEntries(formData.entries());

                const res = await fetch(form.action, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(payload),
                    credentials: "include"
                });

                const text = await res.text();

                let responseData;

                try {
                    responseData = JSON.parse(text);
                } catch (err) {
                    console.error("Server returned non JSON:", text);
                    alert("Server error: expected JSON response");
                    return;
                }

                if (responseData.success) {

                    if (message) {
                        message.style.display = "block";
                        setTimeout(() => message.style.display = "none", 3000);
                    }

                    if (receiptNumberInput)
                        receiptNumberInput.value = responseData.receiptNo;

                    if (downloadBtn) {
                        downloadBtn.disabled = false;
                        downloadBtn.style.display = "inline-block";
                    }

                } else {
                    alert("Error saving receipt: " + (responseData.message || "Unknown error"));
                }

            } catch (err) {
                console.error("Fetch error:", err);
                alert("Error saving receipt: " + err.message);
            }

        });

    }

    /* ---------------- Download PDF ---------------- */

    if (downloadBtn) {

        downloadBtn.addEventListener("click", async function () {

            const receiptNo = receiptNumberInput.value.trim();

            if (!receiptNo) {
                alert("Please save the receipt first!");
                return;
            }

            try {

                const response = await fetch(`/receipt/${receiptNo}/pdf`, {
                    method: "GET",
                    credentials: "include"
                });

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(text || "PDF not found");
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = url;
                link.download = `Receipt_${receiptNo}.pdf`;

                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                window.URL.revokeObjectURL(url);

            } catch (err) {
                console.error("PDF Download Error:", err);
                alert("Unable to download PDF. Please try again.");
            }

        });

    }

    /* ---------------- Reset Form ---------------- */

    if (resetBtn) {

        resetBtn.addEventListener("click", function () {

            form.reset();

            if (amountWords) amountWords.value = "";
            if (receiptNumberInput) receiptNumberInput.value = "";

            if (downloadBtn) downloadBtn.disabled = true;
            if (message) message.style.display = "none";

        });

    }

});