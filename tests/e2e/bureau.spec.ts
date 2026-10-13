import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function scenario(page: Page, title: string) {
  await page.getByRole('button', { name: 'Сценарий' }).click()
  await page.getByRole('menuitem', { name: new RegExp(title) }).click()
}

const card = (page: Page, id: string) => page.locator(`[data-ghost="${id}"]`)

test.beforeEach(async ({ page }) => {
  await page.goto('/')
})

test('the demo day places nine of eleven ghosts and explains every decision', async ({ page }) => {
  await expect(page.getByText('Расселено').locator('..')).toContainText('9/11')

  await card(page, 'countess').getByRole('button').first().click()
  await expect(card(page, 'countess')).toContainText('Нет чердака: Маяк на Тёмном мысе, Подвал старой типографии, Часовня на холме')

  await card(page, 'draft').getByRole('button').first().click()
  await expect(card(page, 'draft')).toContainText('Температура ровно любимая (10°)')
  await expect(card(page, 'draft')).toContainText('82')
})

test('a manual choice that breaks the rules needs confirmation and shows up in the report', async ({ page }) => {
  await card(page, 'agata').getByRole('button').first().click()
  await card(page, 'agata').getByRole('button', { name: 'Выбрать место вручную' }).click()
  await page.locator('[data-place="castle"]').click()

  const dialog = page.getByRole('dialog', { name: 'Поселить с нарушениями?' })
  await expect(dialog).toContainText('Есть зеркала')
  await expect(dialog).toContainText('Там иногда бывают люди')
  await dialog.getByRole('button', { name: 'Всё равно поселить' }).click()

  await expect(card(page, 'agata')).toContainText('вручную')
  await expect(card(page, 'agata')).toContainText('Нарушены обязательные условия')

  await page.locator('nav').getByRole('button', { name: /Отчёт/ }).click()
  await expect(page.getByText('Ручные решения с нарушениями').locator('..')).toContainText('1 из 1')
})

test('an overloaded place is flagged on the board and first in the report', async ({ page }) => {
  await scenario(page, 'Место переполнено')
  await expect(page.locator('[data-load="chapel"]')).toContainText('3/1')
  await expect(page.locator('[data-load="chapel"]')).toContainText('Перегружено')

  await page.locator('nav').getByRole('button', { name: /Отчёт/ }).click()
  await expect(page.getByRole('heading', { name: 'Перегруженные и заполненные места' }).locator('..').locator('li').first()).toContainText('Перегружено: 3 при вместимости 1')
})

test('an empty bureau guides the operator, and a new application is placed right away', async ({ page }) => {
  await scenario(page, 'Пустой список заявок')
  await expect(page.getByText('Заявок пока нет')).toBeVisible()

  await page.getByRole('button', { name: 'Добавить заявку' }).click()
  await page.getByRole('button', { name: 'Новая заявка' }).click()
  await page.getByRole('button', { name: 'Сохранить' }).click()
  await expect(page.getByText('Имя от 1 до 60 символов')).toBeVisible()

  await page.getByLabel('Имя').fill('Сквозняк-младший')
  await page.getByText('Нужен чердак').click()
  await page.getByRole('button', { name: 'Сохранить' }).click()

  await page.locator('nav').getByRole('button', { name: /Распределение/ }).click()
  await expect(page.getByText('Расселено').locator('..')).toContainText('1/1')
})

test('a damaged save is reported, kept intact and can be replaced with demo data', async ({ page }) => {
  await page.evaluate(() => localStorage.setItem('ghost-bureau:v1', '{"version":1,"data":'))
  await page.reload()

  const alert = page.getByRole('alert')
  await expect(alert).toContainText('Сохранённые данные не читаются')
  expect(await page.evaluate(() => localStorage.getItem('ghost-bureau:v1'))).toBe('{"version":1,"data":')

  await alert.getByRole('button', { name: 'Начать с демо-данных' }).click()
  await expect(page.getByText('Расселено').locator('..')).toContainText('9/11')
})

test('a wrong file is rejected on import without touching current data', async ({ page }) => {
  await page.locator('input[type="file"]').setInputFiles({ name: 'broken.json', mimeType: 'application/json', buffer: Buffer.from('{"ghosts":[{"id":"g","name":"","anxiety":3}],"places":[]}') })

  await expect(page.getByRole('alert')).toContainText('Файл не загрузился')
  await expect(page.getByRole('alert')).toContainText('Текущие данные не изменились')
  await expect(page.getByText('Расселено').locator('..')).toContainText('9/11')
})

test('returning a manual choice to automatic placement restores the suggestion', async ({ page }) => {
  await scenario(page, 'Ручной выбор с конфликтом')
  await card(page, 'agata').getByRole('button').first().click()
  await card(page, 'agata').getByRole('button', { name: 'Вернуть автоподбор' }).click()

  await expect(card(page, 'agata').getByText('вручную', { exact: true })).toHaveCount(0)
  await expect(card(page, 'agata')).toContainText('Часовня на холме')
})

test('a link to a tab opens it, also on an already open page', async ({ page }) => {
  await page.goto('/#worklog')
  await expect(page.getByRole('heading', { name: 'AI Worklog' })).toBeVisible()

  await page.goto('/#report')
  await expect(page.getByRole('heading', { name: 'Итоговый отчёт' })).toBeVisible()
})
