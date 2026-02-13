export interface ConvertConfig {
  direction: "xml-to-csv" | "csv-to-xml"
  mappings: {
    source: string
    target: string
  }[]
  options?: {
    delimiter?: string
    rootNode?: string
  }
}
