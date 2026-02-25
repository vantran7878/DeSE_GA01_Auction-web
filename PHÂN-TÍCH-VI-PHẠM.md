PHÂN TÍCH VI PHẠM TRONG DỰ ÁN AUCTION WEB



**Index.js**

line 9, 10 -> YAGNI -> delete

C. Redirect thông minh cho trang chủ -> bị comment -> YAGNI -> delete

file filter không sử dung -> YAGNI -> delete



view engine -> SRP -> config/ viewengine

tạo folder -> SRP -> config/ storage

middleware -> SRP ->user.mdw.js \& category.mdw.js



có quá nhiều helper trong view Engine (SRP) -> tách thành folder helper (gồm index, string, date, math, logic, pagination, auction, number)



các helpers (add, gte, lte) khai báo nhiều lần (DRY) -> delete

format date bị lặp lại (DRY) -> function parseDate/ helper pad

format time bị lap lại (DRY) -> helper pad riêng

helper range, length không sử dung -> YAGNI -> delete



gọi các adminroute thẳng trong index -> OCP -> admin.route.js



model vi phạm SRP -> refactor các hàm



hàm create/ get/ has invoice lặp -> DRY -> function create/ get/ has chung

