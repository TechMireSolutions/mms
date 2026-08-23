// MMS Report Card Template (Typst BiDi)
#set page(
  paper: "a4",
  margin: (x: 1.8cm, y: 2.0cm),
  header: align(right)[
    #text(8pt, fill: luma(120))[#datetime.today().display("[year]-[month]-[day]")]
  ]
)

#set text(
  font: ("Readex Pro", "Noto Nastaliq Urdu", "Geist", "Liberation Sans"),
  size: 10pt,
  lang: "ar",
  dir: rtl
)

#let doc_data = json.decode(sys.inputs.at("data", default: "{}"))

#let institution = doc_data.at("institution", default: "Madrasa Management System")
#let student_name = doc_data.at("studentName", default: "الطالب")
#let roll_number = doc_data.at("rollNumber", default: "-")
#let class_name = doc_data.at("className", default: "-")
#let term = doc_data.at("term", default: "نهاية الفصل الدراسي")
#let academic_year = doc_data.at("academicYear", default: "1447-1448")
#let subjects = doc_data.at("subjects", default: ())
#let total_marks = doc_data.at("totalMarks", default: 0)
#let obtained_marks = doc_data.at("obtainedMarks", default: 0)
#let percentage = doc_data.at("percentage", default: "0%")
#let grade = doc_data.at("grade", default: "ممتاز")
#let attendance = doc_data.at("attendance", default: "100%")
#let remarks = doc_data.at("remarks", default: "مستوى ممتاز وتقدم ملحوظ")

// Header
#align(center)[
  #block(
    stroke: (bottom: 1.5pt + rgb("#0f172a")),
    inset: (bottom: 12pt),
    width: 100%,
    [
      #text(16pt, weight: "bold", fill: rgb("#0f172a"))[#institution] \
      #v(4pt)
      #text(13pt, weight: "medium", fill: rgb("#334155"))[بطاقة تقييم الأداء والدرجات | Report Card] \
      #text(10pt, fill: rgb("#64748b"))[العام الدراسي: #academic_year - #term]
    ]
  )
]

#v(10pt)

// Student Info Grid
#table(
  columns: (1fr, 1.5fr, 1fr, 1.5fr),
  stroke: (x, y) => if y == 0 { (bottom: 1pt + rgb("#cbd5e1")) } else { none },
  fill: (col, row) => if calc.even(row) { rgb("#f8fafc") } else { none },
  inset: 7pt,
  [*اسم الطالب:*], [#student_name], [*رقم القيد:*], [#roll_number],
  [*الصف / الحلقة:*], [#class_name], [*نسبة الحضور:*], [#attendance]
)

#v(14pt)

// Subject Results
#text(11pt, weight: "bold", fill: rgb("#0f172a"))[تفاصيل الدرجات والمواد]
#v(6pt)

#table(
  columns: (2.5fr, 1fr, 1fr, 1fr, 1.5fr),
  stroke: 0.5pt + rgb("#cbd5e1"),
  fill: (col, row) => if row == 0 { rgb("#0f172a") } else if calc.even(row) { rgb("#f8fafc") } else { none },
  inset: 7pt,
  align: (col, row) => if row == 0 { center } else if col == 0 { right } else { center },
  
  // Header Row
  table.header(
    [#text(fill: white, weight: "bold")[المادة]],
    [#text(fill: white, weight: "bold")[الدرجة الكاملة]],
    [#text(fill: white, weight: "bold")[الدرجة المحصلة]],
    [#text(fill: white, weight: "bold")[التقدير]],
    [#text(fill: white, weight: "bold")[ملاحظات]]
  ),

  ..for item in subjects {
    (
      [#item.at("name", default: "-")],
      [#str(item.at("maxMarks", default: 100))],
      [#str(item.at("obtainedMarks", default: 0))],
      [#item.at("grade", default: "-")],
      [#item.at("remarks", default: "")]
    )
  }
)

#v(10pt)

// Summary Box
#align(left)[
  #block(
    width: 50%,
    stroke: 1pt + rgb("#0284c7"),
    radius: 4pt,
    fill: rgb("#f0f9ff"),
    inset: 10pt,
    [
      #grid(
        columns: (1.5fr, 1fr),
        row-gutter: 6pt,
        [*المجموع الكلي:*], [#obtained_marks / #total_marks],
        [*النسبة المئوية:*], [#percentage],
        [*التقدير العام:*], [#text(weight: "bold", fill: rgb("#0369a1"))[#grade]]
      )
    ]
  )
]

#v(12pt)

// Remarks & Signatures
#block(
  width: 100%,
  stroke: 0.5pt + rgb("#e2e8f0"),
  radius: 4pt,
  inset: 10pt,
  [
    #text(weight: "bold")[ملاحظات وتوجيهات الإدارة / المدرس:] \
    #v(4pt)
    #text(fill: rgb("#334155"))[#remarks]
  ]
)

#v(25pt)

#grid(
  columns: (1fr, 1fr, 1fr),
  align: center,
  [
    #line(length: 80%, stroke: 0.5pt + rgb("#94a3b8")) \
    #text(9pt, fill: rgb("#64748b"))[توقيع ولي الأمر]
  ],
  [
    #line(length: 80%, stroke: 0.5pt + rgb("#94a3b8")) \
    #text(9pt, fill: rgb("#64748b"))[توقيع مدرس الفصل]
  ],
  [
    #line(length: 80%, stroke: 0.5pt + rgb("#94a3b8")) \
    #text(9pt, fill: rgb("#64748b"))[ختم وتوقيع المدير]
  ]
)
