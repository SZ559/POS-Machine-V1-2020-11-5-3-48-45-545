import {loadAllItems, loadPromotions} from './Dependencies'

export function printReceipt(tags: string[]): string {
  const items = convertTagsToItems(tags)
  const itemsWithDiscountInformation = addDiscountToItems(items)
  return getReceipt(itemsWithDiscountInformation)
}

const availableItems = loadAllItems()
const availablePromotions = loadPromotions()

function addDiscountToItems(items: Item[]): Item[] {
  const validPromotions = getValidPromotion(items)
  if(validPromotions !== undefined && validPromotions.type === 'BUY_TWO_GET_ONE_FREE') {
    for(const barcode of validPromotions.barcodes){
      const itemWithPromotion = items.find((item) => item.barcode === barcode)
      if(itemWithPromotion !== undefined)
      {
        itemWithPromotion.setDiscount(calculateDiscount(itemWithPromotion))
      }
    }
  }
  return [...items]
}

function calculateDiscount(item: Item): number{
  return Math.floor(item.quantity / 3) * item.price
}
function getValidPromotion(items: Item[]): Promotion| undefined {
  //since the only discount is buy two get one, did not consider other promotions here
  const validPromotions = availablePromotions.filter((promotion) => promotion.barcodes.some((barcode) => items.some((item) => item.barcode === barcode)))
  const buyTwoGetOnePromotion = validPromotions.filter((promotion) => promotion.type === 'BUY_TWO_GET_ONE_FREE')
  if(buyTwoGetOnePromotion !== undefined && buyTwoGetOnePromotion.length > 0) {
    return new Promotion(buyTwoGetOnePromotion[0].type, buyTwoGetOnePromotion[0].barcodes)
  }
  return undefined
}

function getReceipt(items: Item[]): string{
  let receipt = `***<store earning no money>Receipt ***\n`
  let discount = 0
  let totalPrice = 0
  items.forEach((item) => {
    receipt += item.toString() + '\n'
    totalPrice += item.getTotalPrice()
    discount += item.discount
  })
  receipt += `----------------------
Total：${totalPrice.toFixed(2)}(yuan)
Discounted prices：${discount.toFixed(2)}(yuan)
**********************`
  return receipt
}

function convertTagsToItems(tags: string[]): Item[] {
  const items: Item[] = []
  tags.forEach((tag) => {
    const tagInformation = splitTagToBarcodeAndQuantity(tag)
    if(tagInformation !== undefined){
      const item = items.find(item => item.barcode === tagInformation.barcode)
      if(item !== undefined)
      {
        item.quantity += tagInformation.quantity
      }
      else
      {
        const newItem = availableItems.find(item => item.barcode === tagInformation.barcode)
        if(newItem !== undefined){
          items.push(new Item(newItem.barcode, newItem.name, newItem.unit, Number(newItem.price), tagInformation.quantity))
        }
      }
    }
  })
  return items
}

function splitTagToBarcodeAndQuantity(tag: string): {barcode: string, quantity: number} | undefined{
  const separator = '-'
  const splited = tag.split(separator)
  if(splited === undefined){
    return undefined
  }

  const barcode = splited[0]
  let quantity = 1
  if(splited.length > 1){
    quantity = Number(splited[1])
  }
  return {barcode: barcode, quantity: quantity}
}
class Item {
  barcode : string
  name: string
  unit: string
  price: number
  quantity: number
  discount: number
  constructor(barcode: string, name: string, unit: string, price: number, quantity: number) {
    this.barcode = barcode
    this.name = name
    this.unit = unit
    this.price = price
    this.quantity = quantity
    this.discount = 0
  }

  public getTotalPrice(): number {
    return this.price * this.quantity - this.discount
  }

  public setDiscount(discount: number): void{
    this.discount = discount
  }

  public toString(): string{
    let unit = this.unit
    if(this.quantity > 1) {
      unit += 's'
    }
    return `Name：${this.name}，Quantity：${this.quantity} ${unit}，Unit：${(this.price).toFixed(2)}(yuan)，Subtotal：${(this.getTotalPrice()).toFixed(2)}(yuan)`
  }
}

class Promotion {
  type : string
  barcodes: string[]
  constructor(type: string, barcodes: string[] ) {
    this.type = type
    this.barcodes = barcodes
  }
}


